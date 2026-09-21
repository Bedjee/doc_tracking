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

        $myOffice = $officeId ? [
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
        ] : ['awaiting_receipt' => 0, 'in_hand' => 0];

        // Preview lists for the two action tiles — capped at 3 each.
        $toReceive = $officeId
            ? Document::where('current_destination_office_id', $officeId)
                ->whereNotIn('status', [
                    Document::STATUS_COMPLETED,
                    Document::STATUS_CANCELLED,
                ])
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