<?php

namespace App\Http\Controllers\Admin;

use App\Actions\RecordMovement;
use App\Enums\MovementType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductRequest;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Store $store): Response
    {
        return Inertia::render('store/products/index', [
            'products' => $store->products()
                ->orderBy('name')
                ->get(['id', 'name', 'barcode', 'price', 'stock', 'min_stock', 'category_id', 'image_path', 'is_active']),
            'categories' => $store->categories()->orderBy('sort_order')->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create(Store $store, Request $request): Response
    {
        return Inertia::render('store/products/create', [
            'categories' => $store->categories()->orderBy('sort_order')->orderBy('name')->get(['id', 'name']),
            'barcode' => $request->query('barcode'),
        ]);
    }

    public function store(ProductRequest $request, Store $store, RecordMovement $recordMovement): RedirectResponse
    {
        $data = $request->safe()->except(['initial_stock', 'image', 'remove_image']);

        $product = $store->products()->create([
            ...$data,
            'stock' => 0,
            'image_path' => $this->storeImage($request, $store),
        ]);

        $initialStock = (int) $request->validated('initial_stock', 0);

        if ($initialStock > 0) {
            $recordMovement->handle($product, MovementType::Restock, $initialStock, $request->user(), 'Stock inicial', $product->cost);
        }

        return to_route('store.products.index', $store)->with('success', 'Producto creado.');
    }

    public function edit(Store $store, Product $product): Response
    {
        return Inertia::render('store/products/edit', [
            'product' => $product->only([
                'id', 'name', 'barcode', 'price', 'cost', 'stock', 'min_stock', 'category_id', 'image_url', 'is_active',
            ]),
            'categories' => $store->categories()->orderBy('sort_order')->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(ProductRequest $request, Store $store, Product $product): RedirectResponse
    {
        $data = $request->safe()->except(['initial_stock', 'image', 'remove_image']);

        if ($request->hasFile('image')) {
            $this->deleteImage($product);
            $data['image_path'] = $this->storeImage($request, $store);
        } elseif ($request->boolean('remove_image')) {
            $this->deleteImage($product);
            $data['image_path'] = null;
        }

        $product->update($data);

        return to_route('store.products.index', $store)->with('success', 'Producto actualizado.');
    }

    public function destroy(Store $store, Product $product): RedirectResponse
    {
        // The barcode is freed so it can be reused by a new product; history keeps the product via soft delete.
        $product->update(['barcode' => null]);
        $product->delete();

        return to_route('store.products.index', $store)->with('success', 'Producto eliminado.');
    }

    private function storeImage(ProductRequest $request, Store $store): ?string
    {
        if (! $request->hasFile('image')) {
            return null;
        }

        return $request->file('image')->store("products/{$store->id}", 'public');
    }

    private function deleteImage(Product $product): void
    {
        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
        }
    }
}
