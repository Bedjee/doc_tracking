<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReturnDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->canActOnDocuments();
    }

    public function rules(): array
    {
        return [
            'return_office_id' => ['required', Rule::exists('offices', 'id')->where('is_active', true)],
            'reason'           => ['required', 'string', 'max:1000'],
            'remarks'          => ['nullable', 'string', 'max:1000'],
        ];
    }
}