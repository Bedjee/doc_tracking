<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DocumentTypeController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/DocumentTypes/Index', [
            'types' => DocumentType::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        DocumentType::create($this->validated($request));
        return back()->with('success', 'Document type created.');
    }

    public function update(Request $request, DocumentType $documentType)
    {
        $documentType->update($this->validated($request, $documentType));
        return back()->with('success', 'Document type updated.');
    }

    public function destroy(DocumentType $documentType)
    {
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