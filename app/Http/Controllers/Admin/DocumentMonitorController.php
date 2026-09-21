<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentRoute;
use App\Models\Office;
use App\Models\TransactionCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DocumentMonitorController extends Controller
{
    public function index(Request $request)
    {


    $this->authorize('viewAny', Document::class);

    $scope = $request->input('scope', 'active'); // active | completed | all

    $filters = $request->only([
        'search',
        'status',
        'current_office_id',
        'destination_office_id',
        'transaction_category_id',
        'overdue_only',
    ]);

  $query = Document::query()
    ->with([
        'type:id,name',
        'transactionCategory:id,name',
        'originatingOffice:id,name',
        'currentOffice:id,name',
        'currentDestination:id,name',
        'routes'          => fn ($q) => $q->orderBy('sequence')->orderBy('id'),
        'routes.office:id,name',
    ]);

    if ($scope === 'active') {
        $query->whereNotIn('status', [
            Document::STATUS_COMPLETED,
            Document::STATUS_CANCELLED,
        ]);
    } elseif ($scope === 'completed') {
        $query->whereIn('status', [
            Document::STATUS_COMPLETED,
            Document::STATUS_CANCELLED,
        ]);
    }

    if (!empty($filters['search'])) {
        $s = $filters['search'];
        $query->where(function ($q) use ($s) {
            $q->where('tracking_number', 'like', "%{$s}%")
              ->orWhere('title', 'like', "%{$s}%")
              ->orWhere('reference_number', 'like', "%{$s}%");
        });
    }

    if (!empty($filters['status'])) {
        $query->where('status', $filters['status']);
    }

    if (!empty($filters['current_office_id'])) {
        $query->where('current_office_id', $filters['current_office_id']);
    }

    if (!empty($filters['destination_office_id'])) {
        $query->where('current_destination_office_id', $filters['destination_office_id']);
    }

    if (!empty($filters['transaction_category_id'])) {
        $query->where('transaction_category_id', $filters['transaction_category_id']);
    }

    if (!empty($filters['overdue_only'])) {
        $query->whereHas('routes', function ($r) {
            $r->whereNotNull('due_at')
              ->whereNull('forwarded_at')
              ->where('due_at', '<', now());
        });
    }

    if ($scope === 'completed') {
        $query->orderByDesc('completed_at')->orderByDesc('updated_at');
    } else {
        $dueSubquery = '
            (SELECT due_at FROM document_routes
             WHERE document_routes.document_id = documents.id
               AND document_routes.forwarded_at IS NULL
               AND document_routes.due_at IS NOT NULL
             ORDER BY document_routes.sequence
             LIMIT 1)
        ';

        $query
            ->orderByRaw("{$dueSubquery} IS NULL ASC")
            ->orderByRaw("{$dueSubquery} ASC")
            ->orderBy('created_at');
    }

    $documents = $query->paginate(20)->withQueryString();

    $summary = [
        'active' => Document::whereNotIn('status', [
            Document::STATUS_COMPLETED,
            Document::STATUS_CANCELLED,
        ])->count(),

        'overdue' => Document::whereNotIn('status', [
            Document::STATUS_COMPLETED,
            Document::STATUS_CANCELLED,
        ])->whereHas('routes', function ($r) {
            $r->whereNotNull('due_at')
              ->whereNull('forwarded_at')
              ->where('due_at', '<', now());
        })->count(),

        'completed' => Document::whereIn('status', [
            Document::STATUS_COMPLETED,
            Document::STATUS_CANCELLED,
        ])->count(),

        'all' => Document::count(),
    ];

    return Inertia::render('Admin/Documents/Monitor', [
        'documents'  => $documents,
        'scope'      => $scope,
        'filters'    => $filters,
        'summary'    => $summary,
        'offices'    => Office::active()->orderBy('name')->get(['id', 'name']),
        'categories' => TransactionCategory::active()
            ->orderBy('min_days')
            ->get(['id', 'name']),
        'statuses'   => Document::STATUSES,
    ]);
}



}