<?php

namespace App\Http\Controllers;

use App\Models\DocumentType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DocumentTypeController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->isAdministrator(), 403);

        return Inertia::render('DocumentTypes/Index', [
            'types' => DocumentType::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->isAdministrator(), 403);

        DocumentType::create($this->validated($request));

        return back()->with('success', 'Document type created.');
    }

    public function update(Request $request, DocumentType $documentType)
    {
        abort_unless($request->user()->isAdministrator(), 403);

        $documentType->update($this->validated($request, $documentType));

        return back()->with('success', 'Document type updated.');
    }

    public function destroy(Request $request, DocumentType $documentType)
    {
        abort_unless($request->user()->isAdministrator(), 403);

        $documentType->update(['is_active' => false]);

        return back()->with('success', 'Document type deactivated.');
    }

    private function validated(Request $request, ?DocumentType $type = null): array
    {
        return $request->validate([
            'name'        => ['required', 'string', 'max:150'],
            'code'        => ['required', 'string', 'max:30', Rule::unique('document_types', 'code')->ignore($type?->id)],
            'description' => ['nullable', 'string', 'max:255'],
            'is_active'   => ['boolean'],
        ]);
    }
}