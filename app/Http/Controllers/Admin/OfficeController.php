<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Office;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OfficeController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Offices/Index', [
            'offices' => Office::withCount('users')->orderBy('name')->paginate(15),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Offices/Form', ['office' => null]);
    }

    public function store(Request $request)
    {
        Office::create($this->validated($request));
        return redirect()->route('offices.index')->with('success', 'Office created.');
    }

    public function edit(Office $office)
    {
        return Inertia::render('Admin/Offices/Form', ['office' => $office]);
    }

    public function update(Request $request, Office $office)
    {
        $office->update($this->validated($request, $office));
        return redirect()->route('offices.index')->with('success', 'Office updated.');
    }

    public function destroy(Office $office)
    {
        // Deactivate rather than hard-delete so route history stays intact.
        $office->update(['is_active' => false]);
        $office->delete();
        return back()->with('success', 'Office deactivated.');
    }

    private function validated(Request $request, ?Office $office = null): array
    {
        return $request->validate([
            'name'        => ['required', 'string', 'max:150'],
            'code'        => ['required', 'string', 'max:30', Rule::unique('offices', 'code')->ignore($office?->id)],
            'description' => ['nullable', 'string', 'max:255'],
            'is_active'   => ['boolean'],
        ]);
    }
}