<?php

namespace App\Http\Controllers\Admin;

use App\Actions\RecordMovement;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CountRequest;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CountController extends Controller
{
    public function create(Store $store): Response
    {
        return Inertia::render('store/inventory/count', [
            'products' => $store->products()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name', 'barcode', 'stock', 'image_path']),
        ]);
    }

    /**
     * Apply a physical count: only products whose counted quantity differs from the system get a movement.
     */
    public function store(CountRequest $request, Store $store, RecordMovement $recordMovement): RedirectResponse
    {
        $items = $request->validated('items');
        $products = $store->products()->whereKey(array_column($items, 'product_id'))->get()->keyBy('id');
        $adjusted = 0;

        DB::transaction(function () use ($items, $products, $recordMovement, $request, &$adjusted): void {
            foreach ($items as $item) {
                $movement = $recordMovement->count($products[$item['product_id']], (int) $item['counted'], $request->user(), 'Conteo físico');

                if ($movement !== null) {
                    $adjusted++;
                }
            }
        });

        $message = $adjusted === 0
            ? 'Conteo guardado: todo coincidía con el sistema.'
            : "Conteo guardado: se corrigieron {$adjusted} producto(s).";

        return to_route('store.inventory.index', $store)->with('success', $message);
    }
}
