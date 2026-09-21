<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ForwardDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->canActOnDocuments();
    }

    public function rules(): array
    {
        return ['remarks' => ['nullable', 'string', 'max:1000']];
    }
}