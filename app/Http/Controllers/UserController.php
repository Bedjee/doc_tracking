<?php

namespace App\Http\Controllers;

use App\Models\Office;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->isAdministrator(), 403);

        $users = User::with('office:id,name')
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")->orWhere('username', 'like', "%{$s}%");
            }))
            ->when($request->office_id, fn ($q, $id) => $q->where('office_id', $id))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Users/Index', [
            'users'   => $users,
            'offices' => Office::active()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'office_id']),
        ]);
    }

    public function create()
    {
        abort_unless(request()->user()->isAdministrator(), 403);

        return Inertia::render('Users/Form', [
            'user'    => null,
            'offices' => Office::active()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->isAdministrator(), 403);

        $data = $this->validated($request);
        $data['password'] = Hash::make($data['password']);

        User::create($data);

        return redirect()->route('users.index')->with('success', 'User created.');
    }

    public function edit(User $user)
    {
        abort_unless(request()->user()->isAdministrator(), 403);

        return Inertia::render('Users/Form', [
            'user'    => $user->only(['id', 'name', 'username', 'email', 'office_id', 'role', 'is_active']),
            'offices' => Office::active()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, User $user)
    {
        abort_unless($request->user()->isAdministrator(), 403);

        $data = $this->validated($request, $user);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return redirect()->route('users.index')->with('success', 'User updated.');
    }

    public function destroy(Request $request, User $user)
    {
        abort_unless($request->user()->isAdministrator(), 403);
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
            'role'      => ['required', 'string', Rule::in(['administrator', 'office_user', 'office_head'])],
            'is_active' => ['boolean'],
        ]);
    }
}