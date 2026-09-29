<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChangePinRequest;

class PinController extends Controller
{
    /**
     * Update the authenticated user's PIN.
     */
    public function update(ChangePinRequest $request)
    {
        $user = $request->user();
        $user->setPin($request->validated('pin'));

        return back()->with('success', 'PIN updated.');
    }
}