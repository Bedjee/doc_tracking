<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Office;
use App\Models\User;
use Illuminate\Http\Request;
// use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
{
    $users = User::with('office:id,name')
        ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
            $q->where('name', 'like', "%{$s}%")
              ->orWhere('username', 'like', "%{$s}%");
        }))
        ->when($request->office_id, fn ($q, $id) => $q->where('office_id', $id))
        ->orderBy('name')
        ->paginate(15)
        ->withQueryString()
        ->through(fn (User $u) => [
            'id'        => $u->id,
            'name'      => $u->name,
            'username'  => $u->username,
            'email'     => $u->email,
            'role'      => $u->role,
            'is_active' => $u->is_active,
            'office'    => $u->office
                ? ['id' => $u->office->id, 'name' => $u->office->name]
                : null,
            'has_pin'   => !empty($u->pin_hash),   // ← the missing piece
        ]);

    return Inertia::render('Admin/Users/Index', [
        'users'   => $users,
        'offices' => Office::active()->orderBy('name')->get(['id', 'name']),
        'filters' => $request->only(['search', 'office_id']),
    ]);
}



    public function create()
    {
        return Inertia::render('Admin/Users/Form', [
            'user'    => null,
            'offices' => Office::active()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
{
    $data = $this->validated($request);

    // No Hash::make() — the User model's 'password' => 'hashed' cast
    // handles hashing automatically on assignment.
    User::create($data);

    return redirect()
        ->route('users.index')
        ->with('success', 'User created.');
}

public function update(Request $request, User $user)
{
    $data = $this->validated($request, $user);

    // Only pass password when the admin actually typed a new one.
    // The model cast hashes it on save.
    if (empty($data['password'])) {
        unset($data['password']);
    }

    $user->update($data);

    return redirect()
        ->route('users.index')
        ->with('success', 'User updated.');
}

    public function edit(User $user)
    {
        return Inertia::render('Admin/Users/Form', [
            'user'    => $user->only(['id', 'name', 'username', 'email', 'office_id', 'role', 'is_active']),
            'offices' => Office::active()->orderBy('name')->get(['id', 'name']),
        ]);
    }


    public function destroy(Request $request, User $user)
    {
        abort_if($request->user()->id === $user->id, 422, 'You cannot deactivate your own account.');
        $user->update(['is_active' => false]);
        return back()->with('success', 'User deactivated.');
    }

    private function validated(Request $request, ?User $user = null): array
    {
        return $request->validate([
            'name'      => ['required', 'string', 'max:150'],
            'username'  => ['required', 'string', 'max:60', Rule::unique('users', 'username')->ignore($user?->id)],
            'email'     => ['nullable', 'email', 'max:150', Rule::unique('users', 'email')->ignore($user?->id)],
            'password'  => [$user ? 'nullable' : 'required', 'string', 'min:8'],
            'office_id' => ['required', Rule::exists('offices', 'id')->where('is_active', true)],
            'role'      => ['required', Rule::in(['administrator', 'office_user', 'office_head'])],
            'is_active' => ['boolean'],
        ]);
    }


    /**
 * Generate a new 4-digit PIN for the user and return it ONCE.
 * The PIN is hashed in the database — this response is the only time
 * the plain value is ever available. The admin must hand it to the
 * user immediately.
 */
public function regeneratePin(Request $request, User $user)
{
    // Generate a PIN that isn't used by any other account.
    $pin = User::generateUniquePin();
    $user->setPin($pin);

    if ($request->wantsJson()) {
        return response()->json([
            'user' => ['id' => $user->id, 'name' => $user->name],
            'pin'  => $pin,
        ]);
    }

    return back()->with('success', "New PIN generated for {$user->name}.");
}



/**
 * Clear the user's PIN. They will need to log in with password until a
 * new PIN is generated.
 */
public function clearPin(Request $request, User $user)
{
    $user->clearPin();

    if ($request->wantsJson()) {
        return response()->json(['ok' => true]);
    }

    return back()->with('success', "PIN cleared for {$user->name}.");
}


}