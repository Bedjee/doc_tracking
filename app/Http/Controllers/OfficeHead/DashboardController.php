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

        // ---- Guard: no office assigned ----
        if (!$officeId) {
            return Inertia::render('OfficeHead/Dashboard', [
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

        // =============================================================
        //  Single shared scope — any document that touched this office
        //  at any point (origin, current, destination, or in route).
        // =============================================================
        $scoped = function () use ($officeId) {
            return Document::where(function ($q) use ($officeId) {
                $q->where('originating_office_id', $officeId)
                  ->orWhere('current_office_id', $officeId)
                  ->orWhere('current_destination_office_id', $officeId)
                  ->orWhereHas(
                      'routes',
                      fn ($r) => $r->where('office_id', $officeId)
                  );
            });
        };

        // ---------- Status counts ----------
        $counts = [
            'total'     => $scoped()->count(),
            'ongoing'   => $scoped()->where('status', Document::STATUS_ONGOING)->count(),
            'received'  => $scoped()->where('status', Document::STATUS_RECEIVED)->count(),
            'completed' => $scoped()->where('status', Document::STATUS_COMPLETED)->count(),
            'returned'  => $scoped()->where('status', Document::STATUS_RETURNED)->count(),
            'cancelled' => $scoped()->where('status', Document::STATUS_CANCELLED)->count(),
        ];

        // ---------- Operational tiles ----------
        $operational = [
            'awaiting_receipt' => Document::where(
                    'current_destination_office_id',
                    $officeId
                )
                ->whereNotIn('status', [
                    Document::STATUS_COMPLETED,
                    Document::STATUS_CANCELLED,
                ])
                ->count(),

            'in_hand' => Document::where('current_office_id', $officeId)
                ->where('status', Document::STATUS_RECEIVED)
                ->count(),

            'overdue' => DocumentRoute::where('office_id', $officeId)
                ->whereNotNull('due_at')
                ->whereNull('forwarded_at')
                ->where('due_at', '<', now())
                ->count(),

            'completed_this_week' => $scoped()
                ->where('status', Document::STATUS_COMPLETED)
                ->where(function ($q) {
                    // Prefer completed_at; fall back to updated_at
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
                ->count(),
        ];

        // =============================================================
        //  14-day activity series — uses the SAME office scope.
        //  Uses whereBetween (index-friendly) instead of whereDate.
        //  Falls back to updated_at when completed_at is missing.
        // =============================================================
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
                        // Primary: completed_at in range
                        $q->whereBetween('completed_at', [$start, $end]);

                        // Fallback: status is COMPLETED but completed_at is null
                        $q->orWhere(function ($q2) use ($start, $end) {
                            $q2->where('status', Document::STATUS_COMPLETED)
                               ->whereNull('completed_at')
                               ->whereBetween('updated_at', [$start, $end]);
                        });
                    })
                    ->count(),
            ];
        })->values();

        // =============================================================
        //  Status distribution — every status, so the sum matches Total
        // =============================================================
        $statusDistribution = [
            ['name' => 'Ongoing',   'value' => $counts['ongoing'],   'color' => '#0ea5e9'],
            ['name' => 'In Hand',   'value' => $counts['received'],  'color' => '#6366f1'],
            ['name' => 'Completed', 'value' => $counts['completed'], 'color' => '#10b981'],
            ['name' => 'Returned',  'value' => $counts['returned'],  'color' => '#f59e0b'],
            ['name' => 'Cancelled', 'value' => $counts['cancelled'], 'color' => '#ef4444'],
        ];

        // =============================================================
        //  Office performance — documents ROUTED THROUGH this office
        //  to any other office. Uses the shared scope so it sees both
        //  outbound (originated here) and pass-through documents.
        // =============================================================
        $officePerformance = DocumentRoute::query()
            ->whereHas('document', function ($q) use ($officeId) {
                $q->where(function ($q) use ($officeId) {
                    $q->where('originating_office_id', $officeId)
                      ->orWhere('current_office_id', $officeId)
                      ->orWhere('current_destination_office_id', $officeId)
                      ->orWhereHas(
                          'routes',
                          fn ($r) => $r->where('office_id', $officeId)
                      );
                });
            })
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

        return Inertia::render('OfficeHead/Dashboard', [
            'counts'             => $counts,
            'operational'        => $operational,
            'dailyActivity'      => $dailyActivity,
            'statusDistribution' => $statusDistribution,
            'officePerformance'  => $officePerformance,
        ]);
    }
}