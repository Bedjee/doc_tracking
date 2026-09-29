<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\PinLoginRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PinLoginController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => \Illuminate\Support\Facades\Route::has('password.request'),
            'status'           => session('status'),
            'initialMode'      => 'pin',
        ]);
    }

    public function store(PinLoginRequest $request): RedirectResponse
{
    $request->ensureIsNotRateLimited();

    $pin = (string) $request->input('pin');

    $user = User::findByPin($pin);

    // Belt-and-suspenders: verify the bcrypt hash too, in case the
    // fingerprint ever gets out of sync (e.g. after APP_KEY rotation).
    if (!$user || !$user->verifyPin($pin)) {
        $request->hitRateLimit();

        throw ValidationException::withMessages([
            'pin' => 'Invalid PIN. Please check with your administrator.',
        ]);
    }

    $request->clearRateLimit();

    Auth::login($user, $request->boolean('remember'));
    $request->session()->regenerate();

    return redirect()->intended(route('dashboard', absolute: false));
}
}