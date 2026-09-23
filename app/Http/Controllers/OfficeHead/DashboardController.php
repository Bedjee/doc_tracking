<?php

namespace App\Http\Controllers\OfficeHead;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentRoute;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user     = $request->user();
        $officeId = $user->office_id;

        $tab = $request->input('tab');
        if (!in_array($tab, ['mine', 'routed'], true)) {
            $tab = 'mine';
        }

        /* ---------------- Guard: no office assigned ---------------- */
        if (!$officeId) {
            return Inertia::render('OfficeHead/Dashboard', [
                'tab'                => $tab,
                'tabCounts'          => ['mine' => 0, 'routed' => 0],
                'myOffice'           => null,
                'counts'             => [
                    'total' => 0, 'ongoing' => 0, 'received' => 0,
                    'completed' => 0, 'returned' => 0, 'cancelled' => 0,
                ],
                'operational'        => [
                    'awaiting_receipt' => 0, 'in_hand' => 0,
                    'overdue' => 0, 'completed_this_week' => 0,
                ],
                'dailyActivity'      => collect(range(13, 0))
                    ->map(function ($daysAgo) {
                        $d = now()->subDays($daysAgo);
                        return [
                            'date'      => $d->toDateString(),
                            'label'     => $d->format('M j'),
                            'created'   => 0,
                            'completed' => 0,
                        ];
                    })->values(),
                'statusDistribution' => [
                    ['name' => 'Ongoing',   'value' => 0, 'color' => '#0ea5e9'],
                    ['name' => 'In Hand',   'value' => 0, 'color' => '#6366f1'],
                    ['name' => 'Completed', 'value' => 0, 'color' => '#10b981'],
                    ['name' => 'Returned',  'value' => 0, 'color' => '#f59e0b'],
                    ['name' => 'Cancelled', 'value' => 0, 'color' => '#ef4444'],
                ],
                'officePerformance'  => [],
            ]);
        }

        /* =============================================================
         *  Tab counts — total documents in each scope
         * ============================================================= */
        $tabCounts = [
            'mine' => Document::where('originating_office_id', $officeId)->count(),

            'routed' => Document::where('originating_office_id', '!=', $officeId)
                ->where(function ($q) use ($officeId) {
                    $q->where('current_office_id', $officeId)
                      ->orWhere('current_destination_office_id', $officeId)
                      ->orWhereHas('routes', fn ($r) => $r->where('office_id', $officeId));
                })
                ->count(),
        ];

        /* =============================================================
         *  The scope used by everything below.
         *    mine   → documents registered by this office
         *    routed → documents from other offices that touch this one
         * ============================================================= */
        $scoped = function () use ($officeId, $tab) {
            $q = Document::query();

            if ($tab === 'mine') {
                $q->where('originating_office_id', $officeId);
            } else {
                $q->where('originating_office_id', '!=', $officeId)
                  ->where(function ($q2) use ($officeId) {
                      $q2->where('current_office_id', $officeId)
                         ->orWhere('current_destination_office_id', $officeId)
                         ->orWhereHas('routes', fn ($r) => $r->where('office_id', $officeId));
                  });
            }

            return $q;
        };

        /* ---------------- Status counts ---------------- */
        $counts = [
            'total'     => $scoped()->count(),
            'ongoing'   => $scoped()->where('status', Document::STATUS_ONGOING)->count(),
            'received'  => $scoped()->where('status', Document::STATUS_RECEIVED)->count(),
            'completed' => $scoped()->where('status', Document::STATUS_COMPLETED)->count(),
            'returned'  => $scoped()->where('status', Document::STATUS_RETURNED)->count(),
            'cancelled' => $scoped()->where('status', Document::STATUS_CANCELLED)->count(),
        ];

        /* =============================================================
         *  Operational tiles — meaning shifts with the tab.
         *
         *  MINE tab — the tiles describe MY outgoing documents:
         *    awaiting_receipt  = my documents not yet received at the next office
         *    in_hand           = my documents currently held by another office
         *    overdue           = my documents whose current holder is overdue
         *    completed_this_week = my documents that finished this week
         *
         *  ROUTED tab — the tiles describe what MY office is doing:
         *    awaiting_receipt  = documents heading to me that I haven't scanned yet
         *    in_hand           = documents I'm currently holding
         *    overdue           = documents overdue while held at MY office
         *    completed_this_week = documents routed through me that finished this week
         * ============================================================= */

        $awaitingReceipt = $tab === 'mine'
            ? $scoped()
                ->whereNotIn('status', [Document::STATUS_COMPLETED, Document::STATUS_CANCELLED])
                ->whereNotNull('current_destination_office_id')
                ->count()
            : $scoped()
                ->where('current_destination_office_id', $officeId)
                ->whereNotIn('status', [Document::STATUS_COMPLETED, Document::STATUS_CANCELLED])
                ->count();

        $inHand = $tab === 'mine'
            ? $scoped()->where('status', Document::STATUS_RECEIVED)->count()
            : $scoped()
                ->where('current_office_id', $officeId)
                ->where('status', Document::STATUS_RECEIVED)
                ->count();

        $overdue = DocumentRoute::query()
            ->whereNotNull('due_at')
            ->whereNull('forwarded_at')
            ->where('due_at', '<', now())
            ->when($tab === 'mine', function ($q) use ($officeId) {
                // My documents that are overdue somewhere else
                $q->where('office_id', '!=', $officeId)
                  ->whereHas('document', fn ($d) => $d
                      ->where('originating_office_id', $officeId)
                      ->whereNotIn('status', [
                          Document::STATUS_COMPLETED,
                          Document::STATUS_CANCELLED,
                      ])
                  );
            }, function ($q) use ($officeId) {
                // Documents overdue while held at MY office
                $q->where('office_id', $officeId)
                  ->whereHas('document', fn ($d) => $d
                      ->where('originating_office_id', '!=', $officeId)
                  );
            })
            ->count();

        $completedThisWeek = $scoped()
            ->where('status', Document::STATUS_COMPLETED)
            ->where(function ($q) {
                $q->whereBetween('completed_at', [
                    now()->startOfWeek(),
                    now()->endOfWeek(),
                ])->orWhere(function ($q2) {
                    $q2->whereNull('completed_at')
                       ->whereBetween('updated_at', [
                           now()->startOfWeek(),
                           now()->endOfWeek(),
                       ]);
                });
            })
            ->count();

        $operational = [
            'awaiting_receipt'    => $awaitingReceipt,
            'in_hand'             => $inHand,
            'overdue'             => $overdue,
            'completed_this_week' => $completedThisWeek,
        ];

        /* =============================================================
         *  14-day activity series — scoped by tab.
         * ============================================================= */
        $dailyActivity = collect(range(13, 0))->map(function ($daysAgo) use ($scoped) {
            $start = now()->subDays($daysAgo)->startOfDay();
            $end   = $start->copy()->endOfDay();

            return [
                'date'  => $start->toDateString(),
                'label' => $start->format('M j'),

                'created' => $scoped()
                    ->whereBetween('created_at', [$start, $end])
                    ->count(),

                'completed' => $scoped()
                    ->where(function ($q) use ($start, $end) {
                        $q->whereBetween('completed_at', [$start, $end]);
                        $q->orWhere(function ($q2) use ($start, $end) {
                            $q2->where('status', Document::STATUS_COMPLETED)
                               ->whereNull('completed_at')
                               ->whereBetween('updated_at', [$start, $end]);
                        });
                    })
                    ->count(),
            ];
        })->values();

        /* ---------------- Status distribution ---------------- */
        $statusDistribution = [
            ['name' => 'Ongoing',   'value' => $counts['ongoing'],   'color' => '#0ea5e9'],
            ['name' => 'In Hand',   'value' => $counts['received'],  'color' => '#6366f1'],
            ['name' => 'Completed', 'value' => $counts['completed'], 'color' => '#10b981'],
            ['name' => 'Returned',  'value' => $counts['returned'],  'color' => '#f59e0b'],
            ['name' => 'Cancelled', 'value' => $counts['cancelled'], 'color' => '#ef4444'],
        ];

        /* =============================================================
         *  Office performance — depends on the tab.
         *
         *  MINE   → where my documents go (destination offices)
         *  ROUTED → which offices send me documents (originating offices)
         * ============================================================= */
        if ($tab === 'mine') {
            $officePerformance = DocumentRoute::query()
                ->whereHas('document', fn ($q) => $q
                    ->where('originating_office_id', $officeId)
                )
                ->where('office_id', '!=', $officeId)
                ->whereNotNull('received_at')
                ->whereNotNull('forwarded_at')
                ->with('office:id,name')
                ->get()
                ->groupBy('office_id')
                ->map(function ($routes) {
                    $avgSeconds = $routes->avg(
                        fn ($r) => $r->received_at->diffInSeconds($r->forwarded_at)
                    );

                    return [
                        'name'      => $routes->first()->office?->name ?? '—',
                        'total'     => $routes->count(),
                        'avg_hours' => $avgSeconds ? round($avgSeconds / 3600, 1) : 0,
                    ];
                })
                ->sortByDesc('total')
                ->take(5)
                ->values();
        } else {
            $officePerformance = Document::query()
                ->where('originating_office_id', '!=', $officeId)
                ->whereHas('routes', fn ($r) => $r->where('office_id', $officeId))
                ->with('originatingOffice:id,name')
                ->get()
                ->groupBy('originating_office_id')
                ->map(function ($docs) {
                    return [
                        'name'      => $docs->first()->originatingOffice?->name ?? '—',
                        'total'     => $docs->count(),
                        'avg_hours' => 0,
                    ];
                })
                ->sortByDesc('total')
                ->take(5)
                ->values();
        }

        return Inertia::render('OfficeHead/Dashboard', [
            'tab'                => $tab,
            'tabCounts'          => $tabCounts,
            'myOffice'           => $user->office?->only(['id', 'name', 'code']),
            'counts'             => $counts,
            'operational'        => $operational,
            'dailyActivity'      => $dailyActivity,
            'statusDistribution' => $statusDistribution,
            'officePerformance'  => $officePerformance,
        ]);
    }
}