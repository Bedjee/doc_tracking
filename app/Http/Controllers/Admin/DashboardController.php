<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentRoute;
use App\Models\Office;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // =============================================================
        //  System-wide counts (Admin sees everything)
        // =============================================================
        $counts = [
            'total'     => Document::count(),
            'created'   => Document::where('status', Document::STATUS_CREATED)->count(),
            'ongoing'   => Document::where('status', Document::STATUS_ONGOING)->count(),
            'received'  => Document::where('status', Document::STATUS_RECEIVED)->count(),
            'completed' => Document::where('status', Document::STATUS_COMPLETED)->count(),
            'returned'  => Document::where('status', Document::STATUS_RETURNED)->count(),
            'cancelled' => Document::where('status', Document::STATUS_CANCELLED)->count(),
        ];

        $systemTotals = [
            'users'   => User::where('is_active', true)->count(),
            'offices' => Office::active()->count(),
        ];

        // =============================================================
        //  Operational metrics — what needs attention right now
        // =============================================================
        $operational = [
            'active' => $counts['created'] + $counts['ongoing'] + $counts['received'],

            'overdue' => DocumentRoute::whereNotNull('due_at')
                ->whereNull('forwarded_at')
                ->where('due_at', '<', now())
                ->whereHas(
                    'document',
                    fn ($q) => $q->whereNotIn('status', [
                        Document::STATUS_COMPLETED,
                        Document::STATUS_CANCELLED,
                    ])
                )
                ->count(),

            'awaiting_receipt' => Document::whereNotIn('status', [
                    Document::STATUS_COMPLETED,
                    Document::STATUS_CANCELLED,
                ])
                ->whereNotNull('current_destination_office_id')
                ->count(),

            'completed_this_week' => Document::where('status', Document::STATUS_COMPLETED)
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
                ->count(),

            'created_this_week' => Document::whereBetween('created_at', [
                now()->startOfWeek(),
                now()->endOfWeek(),
            ])->count(),
        ];

        // =============================================================
        //  30-day activity series (created vs completed)
        // =============================================================
        $dailyActivity = collect(range(29, 0))->map(function ($daysAgo) {
            $start = now()->subDays($daysAgo)->startOfDay();
            $end   = $start->copy()->endOfDay();

            return [
                'date'  => $start->toDateString(),
                'label' => $start->format('M j'),

                'created' => Document::whereBetween('created_at', [$start, $end])
                    ->count(),

                'completed' => Document::where(function ($q) use ($start, $end) {
                    $q->whereBetween('completed_at', [$start, $end])
                      ->orWhere(function ($q2) use ($start, $end) {
                          $q2->where('status', Document::STATUS_COMPLETED)
                             ->whereNull('completed_at')
                             ->whereBetween('updated_at', [$start, $end]);
                      });
                })->count(),
            ];
        })->values();

        // =============================================================
        //  Status distribution — every status so sum == Total
        // =============================================================
        $statusDistribution = [
            ['name' => 'Created',   'value' => $counts['created'],   'color' => '#94a3b8'],
            ['name' => 'Ongoing',   'value' => $counts['ongoing'],   'color' => '#0ea5e9'],
            ['name' => 'In Hand',   'value' => $counts['received'],  'color' => '#6366f1'],
            ['name' => 'Completed', 'value' => $counts['completed'], 'color' => '#10b981'],
            ['name' => 'Returned',  'value' => $counts['returned'],  'color' => '#f59e0b'],
            ['name' => 'Cancelled', 'value' => $counts['cancelled'], 'color' => '#ef4444'],
        ];

        // =============================================================
        //  Office performance — top offices by routed-document volume
        //  Uses avg handling time (received -> forwarded).
        // =============================================================
        $officePerformance = DocumentRoute::query()
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
            ->take(6)
            ->values();

        // =============================================================
        //  Top categories — how the workload splits by processing window
        //  (Simple 3 days, Complex 7 days, Highly Technical 20-30 days)
        // =============================================================
        $topCategories = Document::query()
            ->select('transaction_category_id', DB::raw('count(*) as total'))
            ->with('transactionCategory:id,name,min_days,max_days')
            ->whereNotNull('transaction_category_id')
            ->groupBy('transaction_category_id')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($d) => [
                'name'     => $d->transactionCategory?->name ?? '—',
                'min_days' => $d->transactionCategory?->min_days,
                'max_days' => $d->transactionCategory?->max_days,
                'total'    => (int) $d->total,
            ]);

        // =============================================================
        //  Recent documents — capped short list
        // =============================================================
        $recentDocuments = Document::with([
            'type:id,name',
            'transactionCategory:id,name,min_days,max_days',
            'currentOffice:id,name',
            'currentDestination:id,name',
        ])
            ->latest()
            ->limit(6)
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'counts'             => $counts,
            'systemTotals'       => $systemTotals,
            'operational'        => $operational,
            'dailyActivity'      => $dailyActivity,
            'statusDistribution' => $statusDistribution,
            'officePerformance'  => $officePerformance,
            'topCategories'      => $topCategories,
            'recentDocuments'    => $recentDocuments,
        ]);
    }
}