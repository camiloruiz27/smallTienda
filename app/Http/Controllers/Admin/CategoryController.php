<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Models\Category;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Store $store): Response
    {
        return Inertia::render('store/categories', [
            'categories' => $store->categories()
                ->withCount('products')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'sort_order']),
        ]);
    }

    public function store(CategoryRequest $request, Store $store): RedirectResponse
    {
        $store->categories()->create([
            ...$request->validated(),
            'sort_order' => ($store->categories()->max('sort_order') ?? 0) + 1,
        ]);

        return back()->with('success', 'Categoría creada.');
    }

    public function update(CategoryRequest $request, Store $store, Category $category): RedirectResponse
    {
        $category->update($request->validated());

        return back()->with('success', 'Categoría actualizada.');
    }

    public function destroy(Store $store, Category $category): RedirectResponse
    {
        $category->delete();

        return back()->with('success', 'Categoría eliminada. Sus productos quedaron sin categoría.');
    }
}
