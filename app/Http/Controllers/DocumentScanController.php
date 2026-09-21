<?php

namespace App\Http\Controllers;

use App\Http\Requests\ForwardDocumentRequest;
use App\Http\Requests\ReceiveDocumentRequest;
use App\Http\Requests\ReturnDocumentRequest;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\Office;
use App\Services\DocumentQrService;
use App\Services\DocumentRoutingService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class DocumentScanController extends Controller
{
    public function __construct(
        private DocumentRoutingService $routing,
        private DocumentQrService $qr,
    ) {}

    public function index()
    {
        return Inertia::render('Documents/Scan', [
            'myOffice' => request()->user()->office?->only(['id', 'name', 'code']),
        ]);
    }

    /**
     * Resolve a scanned tracking number and report whether the current user's
     * office is authorized to receive it. Read-only — no transaction created.
     */
    public function lookup(Request $request)
    {
        $data = $request->validate([
            'tracking_number' => ['required', 'string', 'max:60'],
        ]);

        $tracking = trim($data['tracking_number']);

        // Accept either the raw tracking number or a scanned URL payload.
        if (preg_match('/DOC-\d{4}-\d{6}/i', $tracking, $m)) {
            $tracking = strtoupper($m[0]);
        }

        $document = Document::with([
            'type:id,name',
            'originatingOffice:id,name',
            'currentOffice:id,name',
            'currentDestination:id,name',
            'routes.office:id,name',
        ])->where('tracking_number', $tracking)->first();

        if (!$document) {
            throw ValidationException::withMessages([
                'tracking_number' => 'No document found with that tracking number.',
            ]);
        }

        $user = $request->user();

$canReceive = $user->can('receive', $document);
$canForward = $user->can('forward', $document);
$canReturn  = $user->can('returnDocument', $document);

$state = $canReceive
    ? 'receive'
    : ($canForward || $canReturn ? 'forward' : 'unauthorized');

$message = match ($state) {
    'receive' => 'Your office is authorized to receive this document.',
    'forward' => sprintf(
        'This document is currently held by %s and is ready to be forwarded to the next office.',
        $document->currentOffice?->name ?? 'your office'
    ),
    default => sprintf(
        'This document is currently routed to %s. Your office is not authorized to receive it.',
        $document->currentDestination?->name ?? 'an unknown office'
    ),
};

// Current in-flight route step (already-received step has due_at set).
$currentStep = $document->routes
    ->firstWhere('status', 'RECEIVED')
    ?? $document->routes->firstWhere('status', 'CURRENT');

return response()->json([
    'document' => [
        'id'                  => $document->id,
        'tracking_number'     => $document->tracking_number,
        'title'               => $document->title,
        'status'              => $document->status,
        'type'                => $document->type?->name,
        'originating_office'  => $document->originatingOffice?->name,
        'current_office'      => $document->currentOffice?->name,
        'current_destination' => $document->currentDestination?->name,
        'current_destination_id' => $document->current_destination_office_id,
        'transaction_category'   => $document->transactionCategory?->name,
        'processing_days_per_office' => $document->processing_days_per_office,
        'route'               => $document->routes->map(fn ($r) => [
            'sequence'  => $r->sequence,
            'office'    => $r->office?->name,
            'status'    => $r->status,
            'is_return' => $r->is_return,
        ]),
        'url' => route('documents.show', $document),
    ],
    'processing' => $currentStep ? [
        'processing_days'    => $currentStep->processing_days,
        'processing_seconds' => $currentStep->processing_seconds,
        'received_at'        => $currentStep->received_at?->toIso8601String(),
        'due_at'             => $currentStep->due_at?->toIso8601String(),
        'elapsed_seconds'    => $currentStep->elapsed_seconds,
        'remaining_seconds'  => $currentStep->remaining_seconds,
        'is_overdue'         => $currentStep->is_overdue,
        'progress_percent'   => $currentStep->progress_percent,
    ] : null,
    'authorization' => [
        'state'        => $state,
        'my_office'    => $user->office?->name,
        'my_office_id' => $user->office_id,
        'can_receive'  => $canReceive,
        'can_forward'  => $canForward,
        'can_return'   => $canReturn,
        'message'      => $message,
    ],
]);
    }

    public function receive(ReceiveDocumentRequest $request, Document $document)
    {
        $this->authorize('receive', $document);

        $updated = $this->routing->receive(
            $document,
            $request->user(),
            $request->validated('remarks')
        );

        return back()->with('success', "Document {$updated->tracking_number} marked as received.");
    }

    public function forward(ForwardDocumentRequest $request, Document $document)
    {
        $this->authorize('forward', $document);

        $updated = $this->routing->forward(
            $document,
            $request->user(),
            $request->validated('remarks')
        );

        $next = Office::find($updated->current_destination_office_id);

        return back()->with('success', "Document forwarded to {$next?->name}.");
    }

    public function returnDocument(ReturnDocumentRequest $request, Document $document)
    {
        $this->authorize('returnDocument', $document);

        $data = $request->validated();

        $updated = $this->routing->returnDocument(
            $document,
            $request->user(),
            (int) $data['return_office_id'],
            $data['reason'],
            $data['remarks'] ?? null
        );

        return back()->with('warning', "Document {$updated->tracking_number} has been returned.");
    }

    public function cancel(Request $request, Document $document)
    {
        $this->authorize('cancel', $document);

        $data = $request->validate(['reason' => ['required', 'string', 'max:1000']]);

        $updated = $this->routing->cancel($document, $request->user(), $data['reason']);

        return back()->with('info', "Document {$updated->tracking_number} cancelled.");
    }
}