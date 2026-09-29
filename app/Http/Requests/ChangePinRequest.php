<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChangePinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'current_pin' => ['nullable', 'digits:4'],
            'pin'         => ['required', 'digits:4', 'confirmed', 'different:current_pin'],
        ];
    }

    public function withValidator($validator): void
{
    $validator->after(function ($validator) {
        $user = $this->user();
        $newPin = (string) $this->input('pin', '');

        // Current-PIN verification (unchanged)
        if ($user->hasPin()) {
            $current = (string) $this->input('current_pin', '');
            if (!$user->verifyPin($current)) {
                $validator->errors()->add(
                    'current_pin',
                    'The current PIN is incorrect.'
                );
            }
        }

        // Reject PINs already in use by another account.
        if (strlen($newPin) === 4) {
            $fingerprint = \App\Models\User::fingerprintPin($newPin);
            $taken = \App\Models\User::query()
                ->where('pin_fingerprint', $fingerprint)
                ->whereKeyNot($user->id)
                ->exists();

            if ($taken) {
                $validator->errors()->add(
                    'pin',
                    'That PIN is already in use. Please choose another.'
                );
            }
        }
    });
}



    public function attributes(): array
    {
        return [
            'current_pin' => 'current PIN',
            'pin'         => 'new PIN',
        ];
    }
}