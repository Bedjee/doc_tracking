<?php

namespace App\Http\Controllers\OfficeHead;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Monitoring view for an office head: documents their office has touched,
 * split into two tabs:
 *
 *   mine   — documents registered by this office
 *   routed — documents from other offices that pass through this office
 *
 * Processing-time columns are populated from the office's own route step.
 */
class OfficeDocumentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $officeId = $user->office_id;

        $tab = $request->input('tab');
        if (!in_array($tab, ['mine', 'routed'], true)) {
            $tab = 'mine';
        }

        $filters = $request->only(['status', 'overdue_only']);

        /* --------------------------------------------------------------
         *  Tab counts (unfiltered by status/overdue)
         * -------------------------------------------------------------- */
        $tabCounts = [
            'mine' => $officeId
                ? Document::where('originating_office_id', $officeId)->count()
                : 0,

            'routed' => $officeId
                ? Document::where('originating_office_id', '!=', $officeId)
                    ->whereHas('routes', fn ($r) => $r->where('office_id', $officeId))
                    ->count()
                : 0,
        ];

        /* --------------------------------------------------------------
         *  Base query — only this office's route steps are eager-loaded
         *  (ordered by sequence desc so routes[0] is the latest step
         *  involving this office, i.e. the one to display timing for).
         * -------------------------------------------------------------- */
        $query = Document::with([
            'type:id,name',
            'originatingOffice:id,name',
            'currentOffice:id,name',
            'currentDestination:id,name',
            'transactionCategory:id,name',
            'routes' => fn ($q) => $q
                ->where('office_id', $officeId)
                ->orderByDesc('sequence'),
        ]);

        if ($officeId) {
            if ($tab === 'mine') {
                $query->where('originating_office_id', $officeId);
            } else {
                $query->where('originating_office_id', '!=', $officeId)
                      ->whereHas('routes', fn ($r) => $r->where('office_id', $officeId));
            }
        }

        /* ---------------- Filters ---------------- */

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['overdue_only']) && $officeId) {
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
            'tab'       => $tab,
            'tabCounts' => $tabCounts,
            'statuses'  => Document::STATUSES,
            'myOffice'  => $officeId
                ? $user->office?->only(['id', 'name', 'code'])
                : null,
        ]);
    }
}