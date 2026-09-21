<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

/**
 * Single entry point for /dashboard.
 * Dispatches to the role-specific controller so the URL and route name
 * never change for the frontend.
 */
class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return match ($user->role) {
            User::ROLE_ADMINISTRATOR => app(\App\Http\Controllers\Admin\DashboardController::class)
                ->index($request),
            User::ROLE_OFFICE_HEAD => app(\App\Http\Controllers\OfficeHead\DashboardController::class)
                ->index($request),
            default => app(\App\Http\Controllers\Office\DashboardController::class)
                ->index($request),
        };
    }
}