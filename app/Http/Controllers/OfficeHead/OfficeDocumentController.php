<?php

namespace App\Http\Controllers\OfficeHead;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentRoute;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Monitoring view for a head: all documents their office has touched,
 * with processing-time columns.
 */
class OfficeDocumentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $officeId = $user->office_id;

        $filters = $request->only(['status', 'overdue_only']);

        $query = Document::with([
            'type:id,name',
            'originatingOffice:id,name',
            'currentOffice:id,name',
            'currentDestination:id,name',
            'routes' => fn ($q) => $q->where('office_id', $officeId)->orderByDesc('sequence'),
        ])->whereHas('routes', fn ($r) => $r->where('office_id', $officeId));

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['overdue_only'])) {
            $query->whereHas('routes', function ($r) use ($officeId) {
                $r->where('office_id', $officeId)
                  ->whereNotNull('due_at')
                  ->whereNull('forwarded_at')
                  ->where('due_at', '<', now());
            });
        }

        return Inertia::render('OfficeHead/OfficeDocuments/Index', [
            'documents' => $query->latest()->paginate(20)->withQueryString(),
            'filters'   => $filters,
            'statuses'  => Document::STATUSES,
        ]);
    }
}