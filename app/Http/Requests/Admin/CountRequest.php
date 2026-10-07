<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CountRequest extends FormRequest
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
        $store = $this->route('store');

        return [
            'items' => ['required', 'array', 'min:1', 'max:500'],
            'items.*.product_id' => ['required', 'integer', Rule::exists('products', 'id')->where('store_id', $store->id)->whereNull('deleted_at')],
            'items.*.counted' => ['required', 'integer', 'min:0', 'max:100000'],
        ];
    }
}
