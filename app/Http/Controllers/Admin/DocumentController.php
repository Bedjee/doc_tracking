<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\Office;
use App\Services\DocumentQrService;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Admin view of documents — no office filtering, see everything.
 * URLs live under /admin/documents (route names: admin.documents.*).
 */
class DocumentController extends Controller
{
    public function __construct(private DocumentQrService $qr) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Document::class);

        $filters = $request->only([
            'search', 'status', 'document_type_id', 'originating_office_id',
            'current_office_id', 'destination_office_id', 'date_from', 'date_to',
        ]);

        $query = Document::query()->with([
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

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return Inertia::render('Admin/Documents/Index', [
            'documents' => $query->latest()->paginate(20)->withQueryString(),
            'filters'   => $filters,
            'offices'   => Office::active()->orderBy('name')->get(['id', 'name', 'code']),
            'types'     => DocumentType::active()->orderBy('name')->get(['id', 'name']),
            'statuses'  => Document::STATUSES,
        ]);
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

    return Inertia::render('Admin/Documents/Show', [
        'document'  => $document,
        'qrPayload' => $this->qr->payload($document),
        'offices'   => Office::active()->orderBy('name')->get(['id', 'name', 'code']),
        // Admins are view-only for receive/forward/return.
        // Cancel is permitted when the policy allows it.
        'can' => [
            'receive' => false,
            'forward' => false,
            'return'  => false,
            'cancel'  => $user->can('cancel', $document),
        ],
    ]);
}



}