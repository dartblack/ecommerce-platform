<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BulkDeleteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'exists:' . $this->getModelTable() . ',id'],
        ];
    }

    /**
     * Get the model table name based on the route path.
     */
    protected function getModelTable(): string
    {
        $path = $this->path();

        if (str_contains($path, 'products')) {
            return 'products';
        }

        if (str_contains($path, 'categories')) {
            return 'categories';
        }

        if (str_contains($path, 'orders')) {
            return 'orders';
        }

        return 'products'; // default
    }
}

