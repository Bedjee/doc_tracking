<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentEvent;
use App\Models\DocumentRoute;
use App\Models\Office;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DocumentRoutingService
{
    public function __construct(private DocumentService $documents) {}

    /**
     * RECEIVE — the authenticated user's office must match the document's
     * current authorized destination.
     */
 public function receive(Document $document, User $user, ?string $remarks = null): Document
{
    $this->assertUserCanAct($user);

    if ($document->isLocked()) {
        throw ValidationException::withMessages([
            'document' => "This document is {$document->status} and can no longer be received.",
        ]);
    }

    if ((int) $document->current_destination_office_id !== (int) $user->office_id) {
        $destination = Office::find($document->current_destination_office_id);

        throw ValidationException::withMessages([
            'document' => sprintf(
                'Unauthorized destination. This document is currently routed to %s. Your office is not authorized to receive it.',
                $destination?->name ?? 'an unknown office'
            ),
        ]);
    }

    return DB::transaction(function () use ($document, $user, $remarks) {
        $document = Document::whereKey($document->id)->lockForUpdate()->firstOrFail();

        if ((int) $document->current_destination_office_id !== (int) $user->office_id) {
            throw ValidationException::withMessages([
                'document' => 'Unauthorized destination.',
            ]);
        }

        $step = $document->currentRouteStep();

        if (!$step || $step->status === DocumentRoute::STATUS_RECEIVED) {
            throw ValidationException::withMessages([
                'document' => 'This document has already been received at your office.',
            ]);
        }

        $receivedAt = now();

        $dueAt = $step->processing_days
            ? $receivedAt->copy()->addDays($step->processing_days)
            : null;

        // Is this the last step in the route? If so, receiving it means the
        // document is finished — no further actions, no further timer.
        $isFinal = (int) $document->routes()->max('sequence') === (int) $step->sequence;

        $step->update([
            // On a final step, close it immediately with status DONE and set
            // forwarded_at = received_at so LiveElapsed freezes at that instant.
            'status'       => $isFinal
                ? DocumentRoute::STATUS_DONE
                : DocumentRoute::STATUS_RECEIVED,
            'received_at'  => $receivedAt,
            'due_at'       => $dueAt,
            'forwarded_at' => $isFinal ? $receivedAt : null,
        ]);

        $document->update([
            'current_office_id' => $user->office_id,
            'status'            => $isFinal
                ? Document::STATUS_COMPLETED
                : Document::STATUS_RECEIVED,
            'completed_at'      => $isFinal ? $receivedAt : null,
        ]);

        $this->documents->logEvent($document, DocumentEvent::TYPE_RECEIVED, [
            'from_office_id' => null,
            'to_office_id'   => $user->office_id,
            'performed_by'   => $user->id,
            'remarks'        => $remarks,
            'meta'           => [
                'sequence'            => $step->sequence,
                'processing_days'     => $step->processing_days,
                'due_at'              => $dueAt?->toIso8601String(),
                'is_final'            => $isFinal,
                'is_return_to_sender' => (bool) $step->is_return_to_sender,
            ],
        ]);

        if ($isFinal) {
            $this->documents->logEvent($document, DocumentEvent::TYPE_COMPLETED, [
                'from_office_id' => $user->office_id,
                'to_office_id'   => $user->office_id,
                'performed_by'   => $user->id,
                'remarks'        => $step->is_return_to_sender
                    ? 'Returned to sender. Document completed.'
                    : 'Final destination reached. Document completed.',
            ]);
        }

        return $document->fresh([
            'routes.office',
            'events.performer',
            'events.fromOffice',
            'events.toOffice',
        ]);
    });
}




    /**
     * FORWARD — the document must currently be held (RECEIVED) at the user's
     * office. It is forwarded to the next office in the fixed route.
     */
    public function forward(Document $document, User $user, ?string $remarks = null): Document
    {
        $this->assertUserCanAct($user);

        if ($document->isLocked()) {
            throw ValidationException::withMessages([
                'document' => "This document is {$document->status} and can no longer be forwarded.",
            ]);
        }

        if ((int) $document->current_office_id !== (int) $user->office_id) {
            throw ValidationException::withMessages([
                'document' => 'Only the office currently holding this document may forward it.',
            ]);
        }

        return DB::transaction(function () use ($document, $user, $remarks) {
            $document = Document::whereKey($document->id)->lockForUpdate()->firstOrFail();

            $currentStep = $document->routes()
                ->where('office_id', $user->office_id)
                ->where('status', DocumentRoute::STATUS_RECEIVED)
                ->latest('sequence')
                ->first();

            if (!$currentStep) {
                throw ValidationException::withMessages([
                    'document' => 'You must receive this document before forwarding it.',
                ]);
            }

            $nextStep = $document->routes()
                ->where('sequence', '>', $currentStep->sequence)
                ->where('status', DocumentRoute::STATUS_PENDING)
                ->orderBy('sequence')
                ->first();

            if (!$nextStep) {
                throw ValidationException::withMessages([
                    'document' => 'There is no next office in the route. This document is at its final destination.',
                ]);
            }

            $currentStep->update([
                'status'       => DocumentRoute::STATUS_DONE,
                'forwarded_at' => now(),
            ]);

            $nextStep->update(['status' => DocumentRoute::STATUS_CURRENT]);

            $document->update([
                'current_destination_office_id' => $nextStep->office_id,
                'status'                        => Document::STATUS_ONGOING,
            ]);

           $this->documents->logEvent($document, DocumentEvent::TYPE_FORWARDED, [
    'from_office_id' => $user->office_id,
    'to_office_id'   => $nextStep->office_id,
    'performed_by'   => $user->id,
    'remarks'        => $remarks,
    'meta'           => [
        'sequence'        => $nextStep->sequence,
        'processing_time' => $currentStep->fresh()->processing_seconds,  // ✅
    ],
]);
            return $document->fresh(['routes.office', 'events.performer', 'events.fromOffice', 'events.toOffice']);
        });
    }

    /**
     * RETURN — controlled route exception. Appends a new route step rather
     * than mutating history.
     */
    public function returnDocument(Document $document, User $user, int $returnOfficeId, string $reason, ?string $remarks = null): Document
    {
        $this->assertUserCanAct($user);

        if ($document->isLocked()) {
            throw ValidationException::withMessages([
                'document' => "This document is {$document->status} and can no longer be returned.",
            ]);
        }

        if ((int) $document->current_office_id !== (int) $user->office_id) {
            throw ValidationException::withMessages([
                'document' => 'Only the office currently holding this document may return it.',
            ]);
        }

        $target = Office::active()->findOrFail($returnOfficeId);

        return DB::transaction(function () use ($document, $user, $target, $reason, $remarks) {
            $document = Document::whereKey($document->id)->lockForUpdate()->firstOrFail();

            $currentStep = $document->routes()
                ->where('office_id', $user->office_id)
                ->where('status', DocumentRoute::STATUS_RECEIVED)
                ->latest('sequence')
                ->first();

            if (!$currentStep) {
                throw ValidationException::withMessages([
                    'document' => 'You must receive this document before returning it.',
                ]);
            }

            // Close out the current step and any remaining pending steps.
            $currentStep->update([
                'status'       => DocumentRoute::STATUS_DONE,
                'forwarded_at' => now(),
            ]);

            $document->routes()
                ->where('sequence', '>', $currentStep->sequence)
                ->where('status', DocumentRoute::STATUS_PENDING)
                ->update(['status' => DocumentRoute::STATUS_SKIPPED]);

            $nextSequence = ((int) $document->routes()->max('sequence')) + 1;

            DocumentRoute::create([
                'document_id' => $document->id,
                'office_id'   => $target->id,
                'sequence'    => $nextSequence,
                'status'      => DocumentRoute::STATUS_CURRENT,
                'is_return'   => true,
            ]);

            $document->update([
                'current_destination_office_id' => $target->id,
                'status'                        => Document::STATUS_RETURNED,
            ]);

            $this->documents->logEvent($document, DocumentEvent::TYPE_RETURNED, [
                'from_office_id' => $user->office_id,
                'to_office_id'   => $target->id,
                'performed_by'   => $user->id,
                'remarks'        => trim($reason . ($remarks ? "\n" . $remarks : '')),
                'meta'           => ['reason' => $reason, 'sequence' => $nextSequence],
            ]);

            return $document->fresh(['routes.office', 'events.performer', 'events.fromOffice', 'events.toOffice']);
        });
    }

    public function cancel(Document $document, User $user, string $reason): Document
    {
        if ($document->isLocked()) {
            throw ValidationException::withMessages([
                'document' => "This document is already {$document->status}.",
            ]);
        }

        return DB::transaction(function () use ($document, $user, $reason) {
            $document->update(['status' => Document::STATUS_CANCELLED]);

            $document->routes()
                ->whereIn('status', [DocumentRoute::STATUS_PENDING, DocumentRoute::STATUS_CURRENT])
                ->update(['status' => DocumentRoute::STATUS_SKIPPED]);

            $this->documents->logEvent($document, DocumentEvent::TYPE_CANCELLED, [
                'from_office_id' => $document->current_office_id,
                'performed_by'   => $user->id,
                'remarks'        => $reason,
            ]);

            return $document->fresh();
        });
    }

    private function assertUserCanAct(User $user): void
    {
        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'user' => 'Your account is inactive.',
            ]);
        }

        if (!$user->office_id) {
            throw ValidationException::withMessages([
                'user' => 'Your account is not assigned to an office.',
            ]);
        }
    }
}