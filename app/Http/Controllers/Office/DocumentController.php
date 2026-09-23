<?php

namespace App\Http\Controllers\Office;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentRequest;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\Office;
use App\Models\TransactionCategory;
use App\Services\DocumentOcrService;
use App\Services\DocumentQrService;
use App\Services\DocumentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * Day-to-day document actions for office users (and office heads acting
 * in their office capacity). Scoped by Document::visibleTo().
 */
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
        $officeId = $user->office_id;

        /*
         * Two tabs:
         *   mine   — documents registered by the user's own office
         *   routed — documents from other offices that are routed to/through
         *            the user's office (current holder, next destination, or
         *            anywhere in the route history)
         */
        $tab = $request->input('tab');
        if (!in_array($tab, ['mine', 'routed'], true)) {
            $tab = 'mine';
        }

        $filters = $request->only([
            'search', 'status', 'document_type_id', 'originating_office_id',
            'current_office_id', 'destination_office_id', 'date_from', 'date_to', 'scope',
        ]);

        /* --------------------------------------------------------------
         *  Tab counts (unfiltered by search/status — just by office scope)
         * -------------------------------------------------------------- */
        $countBase = Document::query()->visibleTo($user);

        $tabCounts = [
            'mine' => $officeId
                ? (clone $countBase)->where('originating_office_id', $officeId)->count()
                : 0,

            'routed' => $officeId
                ? (clone $countBase)
                    ->where('originating_office_id', '!=', $officeId)
                    ->where(function ($q) use ($officeId) {
                        $q->where('current_office_id', $officeId)
                          ->orWhere('current_destination_office_id', $officeId)
                          ->orWhereHas('routes', fn ($r) => $r->where('office_id', $officeId));
                    })
                    ->count()
                : 0,
        ];

        /* --------------------------------------------------------------
         *  Main query
         * -------------------------------------------------------------- */
        $query = Document::query()
            ->visibleTo($user)
            ->with([
                'type:id,name',
                'originatingOffice:id,name',
                'currentOffice:id,name',
                'currentDestination:id,name',
            ]);

        // Tab scoping.
        if ($officeId) {
            if ($tab === 'mine') {
                $query->where('originating_office_id', $officeId);
            } else {
                $query->where('originating_office_id', '!=', $officeId)
                      ->where(function ($q) use ($officeId) {
                          $q->where('current_office_id', $officeId)
                            ->orWhere('current_destination_office_id', $officeId)
                            ->orWhereHas('routes', fn ($r) => $r->where('office_id', $officeId));
                      });
            }
        }

        // Search
        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(function ($q) use ($s) {
                $q->where('tracking_number', 'like', "%{$s}%")
                  ->orWhere('title', 'like', "%{$s}%")
                  ->orWhere('reference_number', 'like', "%{$s}%")
                  ->orWhere('subject', 'like', "%{$s}%");
            });
        }

        // Dropdown filters
        foreach ([
            'status', 'document_type_id', 'originating_office_id',
            'current_office_id', 'destination_office_id',
        ] as $field) {
            if (!empty($filters[$field])) {
                $column = $field === 'destination_office_id'
                    ? 'current_destination_office_id'
                    : $field;
                $query->where($column, $filters[$field]);
            }
        }

        // Date range
        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        // Legacy scope filter (still used by some deep links)
        if (($filters['scope'] ?? null) === 'my_office' && $officeId) {
            $query->where(function ($q) use ($officeId) {
                $q->where('current_office_id', $officeId)
                  ->orWhere('current_destination_office_id', $officeId);
            });
        }

        return Inertia::render('Documents/Index', [
            'documents' => $query->latest()->paginate(15)->withQueryString(),
            'filters'   => $filters,
            'tab'       => $tab,
            'tabCounts' => $tabCounts,
            'offices'   => Office::active()->orderBy('name')->get(['id', 'name', 'code']),
            'types'     => DocumentType::active()->orderBy('name')->get(['id', 'name']),
            'statuses'  => Document::STATUSES,
            'myOffice'  => $officeId ? $user->office?->only(['id', 'name', 'code']) : null,
        ]);
    }

    public function create(Request $request)
    {
        $this->authorize('create', Document::class);

        return Inertia::render('Documents/Create', [
            'offices'    => Office::active()->orderBy('name')->get(['id', 'name', 'code', 'description']),
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
            'qrPayload' => $this->qr->payload($document),
            'can'       => [
                'receive' => $user->can('receive', $document),
                'forward' => $user->can('forward', $document),
                'return'  => $user->can('returnDocument', $document),
                'cancel'  => $user->can('cancel', $document),
            ],
            'offices' => Office::active()->orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function qr(Document $document)
    {
        $this->authorize('view', $document);

        return response($this->qr->svg($document, 400), 200, [
            'Content-Type' => 'image/svg+xml',
        ]);
    }

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
            'suggestions' => [
                'title'            => $result['title'],
                'reference_number' => $result['reference_number'],
                'document_date'    => $result['date'],
                'subject'          => $result['subject'],
            ],
            'raw_text' => $result['raw_text'],
        ]);
    }
}