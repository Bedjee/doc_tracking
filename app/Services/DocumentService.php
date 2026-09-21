<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentEvent;
use App\Models\DocumentRoute;
use App\Models\TransactionCategory;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DocumentService
{
    /**
     * Generate a unique, human-readable tracking number.
     * Format: DOC-YYYY-NNNNNN
     */
    public function generateTrackingNumber(): string
    {
        $year = (int) now()->format('Y');

        return DB::transaction(function () use ($year) {
            DB::table('document_sequences')->insertOrIgnore([
                'year'        => $year,
                'last_number' => 0,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);

            $row = DB::table('document_sequences')
                ->where('year', $year)
                ->lockForUpdate()
                ->first();

            $next = $row->last_number + 1;

            DB::table('document_sequences')
                ->where('year', $year)
                ->update([
                    'last_number' => $next,
                    'updated_at'  => now(),
                ]);

            return sprintf('DOC-%d-%06d', $year, $next);
        });
    }

    /**
     * Create a document + its route steps + initial event.
     *
     * When `return_to_sender` is true, the originating office is appended
     * as the final route step. Because DocumentRoutingService::receive()
     * marks the document COMPLETED only when the *last* route step is
     * received, this guarantees the document is not considered finished
     * until it physically returns to the sender.
     *
     * @param  array $data  Validated StoreDocumentRequest payload
     */
    public function create(array $data, User $user): Document
    {
        return DB::transaction(function () use ($data, $user) {

            /* ---------------- Transaction category ---------------- */

            $category = !empty($data['transaction_category_id'])
                ? TransactionCategory::active()
                    ->findOrFail($data['transaction_category_id'])
                : null;

            $processingDays = $category?->defaultDays();

            /* ---------------- Build the ordered route ---------------- */

            $originId = (int) $data['originating_office_id'];

            $destinations = collect($data['route'] ?? [])
                ->map(fn ($id) => (int) $id)
                ->reject(fn ($id) => $id === $originId)
                ->unique()
                ->values();

            $orderedOfficeIds = collect([$originId])->merge($destinations);

            $returnToSender = !empty($data['return_to_sender']);

            // Only append the sender when there is at least one real
            // destination — otherwise the origin would be the only step
            // and the flag would be meaningless.
            if ($returnToSender && $destinations->isNotEmpty()) {
                $orderedOfficeIds->push($originId);
            } else {
                // Guard against a partially-set flag that can't be honoured.
                $returnToSender = false;
            }

            $orderedOfficeIds = $orderedOfficeIds->values()->all();
            $lastIndex        = count($orderedOfficeIds) - 1;

            /* ---------------- Create the document ---------------- */

            $document = Document::create([
                'tracking_number'               => $this->generateTrackingNumber(),
                'title'                         => $data['title'],
                'document_type_id'              => $data['document_type_id'] ?? null,
                'transaction_category_id'       => $category?->id,
                'processing_days_per_office'    => $processingDays,
                'return_to_sender'              => $returnToSender,
                'reference_number'              => $data['reference_number'] ?? null,
                'document_date'                 => $data['document_date'] ?? null,
                'subject'                       => $data['subject'] ?? null,
                'originating_office_id'         => $originId,
                'created_by'                    => $user->id,
                'current_office_id'             => $originId,
                'current_destination_office_id' => $orderedOfficeIds[1] ?? $originId,
                'status'                        => Document::STATUS_CREATED,
                'remarks'                       => $data['remarks'] ?? null,
                'document_image_path'           => $data['document_image_path'] ?? null,
                'ocr_raw_text'                  => $data['ocr_raw_text'] ?? null,
            ]);

            /* ---------------- Create the route steps ---------------- */

            foreach ($orderedOfficeIds as $index => $officeId) {
                DocumentRoute::create([
                    'document_id'         => $document->id,
                    'office_id'           => $officeId,
                    'sequence'            => $index + 1,
                    'status'              => match ($index) {
                        0       => DocumentRoute::STATUS_DONE,
                        1       => DocumentRoute::STATUS_CURRENT,
                        default => DocumentRoute::STATUS_PENDING,
                    },
                    'processing_days'     => $processingDays,
                    'forwarded_at'        => $index === 0 ? now() : null,
                    'is_return_to_sender' => $returnToSender && $index === $lastIndex,
                ]);
            }

            /* ---------------- Initial audit event ---------------- */

            $this->logEvent($document, DocumentEvent::TYPE_CREATED, [
                'from_office_id' => null,
                'to_office_id'   => $orderedOfficeIds[1] ?? null,
                'performed_by'   => $user->id,
                'remarks'        => $data['remarks'] ?? null,
                'meta'           => [
                    'transaction_category' => $category?->name,
                    'processing_days'      => $processingDays,
                    'return_to_sender'     => $returnToSender,
                    'route'                => $orderedOfficeIds,
                ],
            ]);

            return $document->fresh(['routes.office', 'events']);
        });
    }

    /**
     * Append an event to a document's audit trail.
     */
    public function logEvent(Document $document, string $type, array $attributes = []): DocumentEvent
    {
        return DocumentEvent::create(array_merge([
            'document_id' => $document->id,
            'event_type'  => $type,
        ], $attributes));
    }
}