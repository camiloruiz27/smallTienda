<?php

namespace App\Http\Requests\Admin;

use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80'],
            'payment_key' => ['nullable', 'string', 'max:80'],
            'payment_qr' => ['nullable', 'image', 'max:4096'],
            'remove_payment_qr' => ['nullable', 'boolean'],
            'payment_instructions' => ['nullable', 'string', 'max:500'],
            'accepted_payment_methods' => ['required', 'array', 'min:1'],
            'accepted_payment_methods.*' => ['string', Rule::in(PaymentMethod::values())],
        ];
    }
}
