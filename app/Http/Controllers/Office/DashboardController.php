<?php

namespace App\Http\Controllers\Office;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $officeId = $user->office_id;

        // Office-scoped, not user-scoped — anyone in the office can act.
        $base = Document::visibleTo($user);

        $counts = [
            'total'     => (clone $base)->count(),
            'ongoing'   => (clone $base)->where('status', Document::STATUS_ONGOING)->count(),
            'received'  => (clone $base)->where('status', Document::STATUS_RECEIVED)->count(),
            'completed' => (clone $base)->where('status', Document::STATUS_COMPLETED)->count(),
            'returned'  => (clone $base)->where('status', Document::STATUS_RETURNED)->count(),
        ];

        /*
         * "Awaiting receipt" = routed to my office but NOT yet scanned in.
         *
         * Once an office receives a document, the route service sets
         * status = RECEIVED while leaving current_destination_office_id
         * pointing at that same office. Without excluding RECEIVED here,
         * the document would keep showing under "To receive" forever.
         *
         * RETURNED is intentionally NOT excluded — a returned document
         * is on its way to a new office and that office is genuinely
         * awaiting its arrival.
         */
        $notAwaitingStatuses = [
            Document::STATUS_RECEIVED,
            Document::STATUS_COMPLETED,
            Document::STATUS_CANCELLED,
        ];

        $myOffice = $officeId ? [
            'awaiting_receipt' => Document::where(
                    'current_destination_office_id',
                    $officeId
                )
                ->whereNotIn('status', $notAwaitingStatuses)
                ->count(),

            'in_hand' => Document::where('current_office_id', $officeId)
                ->where('status', Document::STATUS_RECEIVED)
                ->count(),
        ] : ['awaiting_receipt' => 0, 'in_hand' => 0];

        // Preview lists for the two action tiles — capped at 3 each.
        $toReceive = $officeId
            ? Document::where('current_destination_office_id', $officeId)
                ->whereNotIn('status', $notAwaitingStatuses)
                ->with([
                    'type:id,name',
                    'originatingOffice:id,name',
                    'transactionCategory:id,name',
                ])
                ->orderByDesc('updated_at')
                ->limit(3)
                ->get()
            : collect();

        $inHand = $officeId
            ? Document::where('current_office_id', $officeId)
                ->where('status', Document::STATUS_RECEIVED)
                ->with([
                    'type:id,name',
                    'currentDestination:id,name',
                    'transactionCategory:id,name',
                ])
                ->orderByDesc('updated_at')
                ->limit(3)
                ->get()
            : collect();

        return Inertia::render('Office/Dashboard', [
            'counts'    => $counts,
            'myOffice'  => $myOffice,
            'toReceive' => $toReceive,
            'inHand'    => $inHand,
        ]);
    }
}