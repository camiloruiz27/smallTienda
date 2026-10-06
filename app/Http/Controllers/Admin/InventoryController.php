<?php

namespace App\Http\Controllers\Admin;

use App\Actions\RecordMovement;
use App\Enums\MovementType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdjustStockRequest;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    /**
     * Stock overview, filterable by products that need attention.
     */
    public function index(Request $request, Store $store): Response
    {
        $filter = in_array($request->query('filter'), ['low', 'negative'], true) ? $request->query('filter') : 'all';

        $products = $store->products()
            ->active()
            ->when($filter === 'low', fn ($query) => $query->lowStock())
            ->when($filter === 'negative', fn ($query) => $query->negativeStock())
            ->orderBy('stock')
            ->orderBy('name')
            ->get(['id', 'name', 'barcode', 'stock', 'min_stock', 'image_path']);

        return Inertia::render('store/inventory/index', [
            'products' => $products,
            'filter' => $filter,
            'counts' => [
                'low' => $store->products()->active()->lowStock()->count(),
                'negative' => $store->products()->active()->negativeStock()->count(),
            ],
        ]);
    }

    /**
     * Full history of stock movements.
     */
    public function movements(Request $request, Store $store): Response
    {
        $productId = $request->integer('product') ?: null;

        $movements = $store->movements()
            ->with(['product:id,name,deleted_at', 'user:id,name'])
            ->when($productId, fn ($query) => $query->where('product_id', $productId))
            ->latest('created_at')
            ->latest('id')
            ->paginate(30)
            ->withQueryString()
            ->through(fn ($movement): array => [
                'id' => $movement->id,
                'type' => $movement->type->value,
                'type_label' => $movement->type->label(),
                'quantity' => $movement->quantity,
                'note' => $movement->note,
                'product_name' => $movement->product?->name,
                'user_name' => $movement->user?->name,
                'created_at' => $movement->created_at->toIso8601String(),
            ]);

        return Inertia::render('store/inventory/movements', [
            'movements' => $movements,
            'product' => $productId ? $store->products()->whereKey($productId)->first(['id', 'name']) : null,
        ]);
    }

    /**
     * Manual correction (adjustment) or loss (waste) for a single product.
     */
    public function adjust(AdjustStockRequest $request, Store $store, Product $product, RecordMovement $recordMovement): RedirectResponse
    {
        $type = MovementType::from($request->validated('type'));
        $quantity = (int) $request->validated('quantity');

        $delta = match (true) {
            $type === MovementType::Waste => -$quantity,
            $request->validated('direction') === 'remove' => -$quantity,
            default => $quantity,
        };

        $recordMovement->handle($product, $type, $delta, $request->user(), $request->validated('note'));

        return back()->with('success', 'Inventario actualizado.');
    }
}
