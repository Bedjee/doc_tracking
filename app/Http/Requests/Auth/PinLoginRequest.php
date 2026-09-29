<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PinLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
{
    return [
        'pin' => ['required', 'digits:4'],
    ];
}

protected function throttleKey(): string
{
    // No username anymore — throttle by IP only.
    // 10 attempts / 15 min. An attacker can't feasibly enumerate
    // 10,000 PINs under that cap, and every miss lands in the logs.
    return 'pin-login|' . $this->ip();
}

    /**
     * Enforce rate limiting BEFORE the credentials are checked.
     * 5 attempts per username+IP per 15 minutes.
     */
    public function ensureIsNotRateLimited(): void
{
    $key = $this->throttleKey();

    if (!RateLimiter::tooManyAttempts($key, 10)) {
        return;
    }

    event(new Lockout($this));

    $seconds = RateLimiter::availableIn($key);

    throw ValidationException::withMessages([
        'pin' => trans('auth.throttle', [
            'seconds' => $seconds,
            'minutes' => ceil($seconds / 60),
        ]),
    ]);
}

public function hitRateLimit(): void
{
    RateLimiter::hit($this->throttleKey(), 15 * 60);
}

    public function clearRateLimit(): void
    {
        RateLimiter::clear($this->throttleKey());
    }

    
}