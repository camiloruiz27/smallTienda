<?php

namespace App\Http\Requests\Admin;

use App\Enums\MovementType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdjustStockRequest extends FormRequest
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
            'type' => ['required', Rule::in([MovementType::Adjustment->value, MovementType::Waste->value])],
            'quantity' => ['required', 'integer', 'min:1', 'max:100000'],
            'direction' => ['required_if:type,'.MovementType::Adjustment->value, Rule::in(['add', 'remove'])],
            'note' => ['nullable', 'string', 'max:200'],
        ];
    }
}
