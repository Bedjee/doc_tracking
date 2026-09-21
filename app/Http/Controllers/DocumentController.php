<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDocumentRequest;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\Office;
use App\Services\DocumentOcrService;
use App\Services\DocumentQrService;
use App\Models\TransactionCategory;
use App\Services\DocumentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DocumentController extends Controller
{
    public function __construct(
        private DocumentService $documents,
        private DocumentQrService $qr,
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Document::class);

        $user = $request->user();

        $filters = $request->only([
            'search', 'status', 'document_type_id', 'originating_office_id',
            'current_office_id', 'destination_office_id', 'date_from', 'date_to', 'scope',
        ]);

        $query = Document::query()
            ->visibleTo($user)
            ->with([
                'type:id,name',
                'originatingOffice:id,name',
                'currentOffice:id,name',
                'currentDestination:id,name',
            ]);

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(function ($q) use ($s) {
                $q->where('tracking_number', 'like', "%{$s}%")
                  ->orWhere('title', 'like', "%{$s}%")
                  ->orWhere('reference_number', 'like', "%{$s}%")
                  ->orWhere('subject', 'like', "%{$s}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['document_type_id'])) {
            $query->where('document_type_id', $filters['document_type_id']);
        }

        if (!empty($filters['originating_office_id'])) {
            $query->where('originating_office_id', $filters['originating_office_id']);
        }

        if (!empty($filters['current_office_id'])) {
            $query->where('current_office_id', $filters['current_office_id']);
        }

        if (!empty($filters['destination_office_id'])) {
            $query->where('current_destination_office_id', $filters['destination_office_id']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (($filters['scope'] ?? null) === 'my_office' && $user->office_id) {
            $query->where(function ($q) use ($user) {
                $q->where('current_office_id', $user->office_id)
                  ->orWhere('current_destination_office_id', $user->office_id);
            });
        }

        return Inertia::render('Documents/Index', [
            'documents' => $query->latest()->paginate(15)->withQueryString(),
            'filters'   => $filters,
            'offices'   => Office::active()->orderBy('name')->get(['id', 'name', 'code']),
            'types'     => DocumentType::active()->orderBy('name')->get(['id', 'name']),
            'statuses'  => Document::STATUSES,
        ]);
    }

public function create(Request $request)
{
    $this->authorize('create', Document::class);

    return Inertia::render('Documents/Create', [
        'offices'    => Office::active()->orderBy('name')->get(['id', 'name', 'code', 'description']),
        'types'      => DocumentType::active()->orderBy('name')->get(['id', 'name']),
        'categories' => TransactionCategory::active()
            ->orderBy('min_days')
            ->get(['id', 'name', 'code', 'description', 'min_days', 'max_days']),
        'defaultOriginatingOfficeId' => $request->user()->office_id,
    ]);
}


    public function store(StoreDocumentRequest $request)
    {
        $document = $this->documents->create(
            $request->validated(),
            $request->user()
        );

        return redirect()
            ->route('documents.show', $document)
            ->with('success', "Document {$document->tracking_number} registered successfully.");
    }

    public function show(Document $document)
    {
        $this->authorize('view', $document);

        $document->load([
    'type', 'originatingOffice', 'currentOffice', 'currentDestination',
    'transactionCategory',
    'creator:id,name',
    'routes.office',
    'events.performer:id,name',
    'events.fromOffice:id,name',
    'events.toOffice:id,name',
]);

        $user = request()->user();

        return Inertia::render('Documents/Show', [
            'document'  => $document,
            'qrDataUri' => $this->qr->dataUri($document, 260),
            'qrPayload' => $this->qr->payload($document),
            'can'       => [
                'receive'  => $user->can('receive', $document),
                'forward'  => $user->can('forward', $document),
                'return'   => $user->can('returnDocument', $document),
                'cancel'   => $user->can('cancel', $document),
            ],
            'offices'   => Office::active()->orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    /** QR image endpoint (SVG) — useful for printing labels. */
    public function qr(Document $document)
    {
        $this->authorize('view', $document);

        return response($this->qr->svg($document, 400), 200, [
            'Content-Type' => 'image/svg+xml',
        ]);
    }

    /**
     * OCR assist endpoint. Stores the uploaded image and returns suggestions.
     * The user ALWAYS confirms/edits the values before creating the record.
     */
    public function ocr(Request $request, DocumentOcrService $ocr)
    {
        $request->validate([
            'image' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,heic', 'max:10240'],
        ]);

        $path = $request->file('image')->store('documents', 'public');
        $absolute = Storage::disk('public')->path($path);

        $result = $ocr->extract($absolute);

        return response()->json([
            'document_image_path' => $path,
            'image_url'           => Storage::disk('public')->url($path),
            'suggestions'         => [
                'title'            => $result['title'],
                'reference_number' => $result['reference_number'],
                'document_date'    => $result['date'],
                'subject'          => $result['subject'],
            ],
            'raw_text' => $result['raw_text'],
        ]);
    }
}