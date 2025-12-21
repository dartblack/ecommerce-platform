<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])],
            'tracking_number' => ['nullable', 'string', 'max:255'],
            'payment_status' => ['nullable', 'string', Rule::in(['pending', 'paid', 'failed', 'refunded','success'])],
        ];
    }
}


