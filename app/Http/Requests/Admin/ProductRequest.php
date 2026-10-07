<?php

namespace App\Http\Requests\Admin;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Empty strings coming from form inputs are treated as "not provided".
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'barcode' => $this->filled('barcode') ? trim((string) $this->input('barcode')) : null,
            'cost' => $this->filled('cost') ? $this->input('cost') : null,
            'category_id' => $this->filled('category_id') ? $this->input('category_id') : null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $store = $this->route('store');
        $product = $this->route('product');

        return [
            'name' => ['required', 'string', 'max:120'],
            'barcode' => [
                'nullable',
                'string',
                'max:64',
                Rule::unique('products', 'barcode')
                    ->where('store_id', $store->id)
                    ->ignore($product instanceof Product ? $product->id : null),
            ],
            'price' => ['required', 'integer', 'min:0', 'max:100000000'],
            'cost' => ['nullable', 'integer', 'min:0', 'max:100000000'],
            'min_stock' => ['required', 'integer', 'min:0', 'max:100000'],
            'category_id' => ['nullable', 'integer', Rule::exists('categories', 'id')->where('store_id', $store->id)],
            'is_active' => ['required', 'boolean'],
            'initial_stock' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'image' => ['nullable', 'image', 'max:4096'],
            'remove_image' => ['nullable', 'boolean'],
        ];
    }
}
