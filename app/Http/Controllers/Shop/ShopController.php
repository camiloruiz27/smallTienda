<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Store;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    /**
     * Public catalog the customer reaches by scanning the store QR. Exact stock is never exposed.
     */
    public function show(Store $store): Response
    {
        return Inertia::render('shop/index', [
            'store' => [
                'name' => $store->name,
                'token' => $store->public_token,
            ],
            'paymentMethods' => collect($store->acceptedPaymentMethods())
                ->map(fn ($method): array => ['value' => $method->value, 'label' => $method->label()])
                ->values(),
            'categories' => $store->categories()->orderBy('sort_order')->orderBy('name')->get(['id', 'name']),
            'products' => $store->products()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name', 'barcode', 'price', 'category_id', 'image_path'])
                ->map->only(['id', 'name', 'barcode', 'price', 'category_id', 'image_url'])
                ->values(),
        ]);
    }

    public function receipt(Store $store, Sale $sale): Response
    {
        return Inertia::render('shop/receipt', [
            'store' => [
                'name' => $store->name,
                'token' => $store->public_token,
                'payment_key' => $store->payment_key,
                'payment_qr_url' => $store->paymentQrUrl(),
                'payment_instructions' => $store->payment_instructions,
            ],
            'sale' => [
                'code' => $sale->code,
                'status' => $sale->status->value,
                'status_label' => $sale->status->label(),
                'payment_method' => $sale->payment_method->value,
                'payment_method_label' => $sale->payment_method->label(),
                'total' => $sale->total,
                'customer_name' => $sale->customer_name,
                'paid_claimed' => $sale->paid_claimed_at !== null,
                'created_at' => $sale->created_at->toIso8601String(),
                'items' => $sale->items()->get()->map->only(['id', 'product_name', 'unit_price', 'quantity', 'subtotal'])->values(),
            ],
        ]);
    }
}
