<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => [
                'sometimes',
                'required',
                'string',
                Rule::in(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
            ],
            'payment_status' => [
                'sometimes',
                'required',
                'string',
                Rule::in(['pending', 'paid', 'failed', 'refunded']),
            ],
            'tracking_number' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}

