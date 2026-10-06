<?php

namespace App\Http\Controllers\Admin;

use App\Actions\RecordMovement;
use App\Enums\MovementType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RestockRequest;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RestockController extends Controller
{
    public function create(Store $store): Response
    {
        return Inertia::render('store/inventory/restock', [
            'products' => $store->products()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name', 'barcode', 'stock', 'cost', 'image_path']),
        ]);
    }

    /**
     * Receive a batch of products into stock in a single step.
     */
    public function store(RestockRequest $request, Store $store, RecordMovement $recordMovement): RedirectResponse
    {
        $items = $request->validated('items');
        $products = $store->products()->whereKey(array_column($items, 'product_id'))->get()->keyBy('id');

        DB::transaction(function () use ($items, $products, $recordMovement, $request): void {
            foreach ($items as $item) {
                $product = $products[$item['product_id']];
                $unitCost = isset($item['unit_cost']) ? (int) $item['unit_cost'] : null;

                $recordMovement->handle(
                    $product,
                    MovementType::Restock,
                    (int) $item['quantity'],
                    $request->user(),
                    $request->validated('note'),
                    $unitCost,
                );

                if ($unitCost !== null) {
                    $product->update(['cost' => $unitCost]);
                }
            }
        });

        return to_route('store.inventory.index', $store)->with('success', 'Reposición guardada: '.count($items).' producto(s).');
    }
}
