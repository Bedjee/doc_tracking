<?php

namespace App\Http\Requests;

use App\Models\Office;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->canActOnDocuments();
    }

    public function rules(): array
{
    return [
        'title'                   => ['required', 'string', 'max:255'],
        'document_type_id'        => ['nullable', Rule::exists('document_types', 'id')->where('is_active', true)],
        'transaction_category_id' => ['required', Rule::exists('transaction_categories', 'id')->where('is_active', true)],
        'reference_number'        => ['nullable', 'string', 'max:120'],
        'document_date'           => ['nullable', 'date'],
        'subject'                 => ['nullable', 'string', 'max:2000'],
        'originating_office_id'   => ['required', Rule::exists('offices', 'id')->where('is_active', true)],
        'route'                   => ['required', 'array', 'min:1'],
        'route.*'                 => ['integer', Rule::exists('offices', 'id')->where('is_active', true)],
        'return_to_sender'        => ['sometimes', 'boolean'],           // ← new
        'remarks'                 => ['nullable', 'string', 'max:2000'],
        'document_image_path'     => ['nullable', 'string', 'max:255'],
        'ocr_raw_text'            => ['nullable', 'string'],
    ];
}



    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $origin = (int) $this->input('originating_office_id');

            $destinations = collect($this->input('route', []))
                ->map(fn ($id) => (int) $id)
                ->reject(fn ($id) => $id === $origin)
                ->unique();

            if ($destinations->isEmpty()) {
                $validator->errors()->add(
                    'route',
                    'The route must contain at least one destination office other than the originating office.'
                );
            }
        });
    }

    public function attributes(): array
    {
        return [
            'document_type_id'      => 'document type',
            'originating_office_id' => 'originating office',
            'transaction_category_id' => 'transaction category',
        ];
    }
}