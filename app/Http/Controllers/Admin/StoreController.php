<?php

namespace App\Http\Controllers\Admin;

use App\Actions\CreateStoreWithOwner;
use App\Enums\SaleStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    /**
     * Store picker for users that belong to more than one store.
     */
    public function index(Request $request): Response
    {
        $stores = $request->user()
            ->stores()
            ->withCount(['sales as pending_sales_count' => fn ($query) => $query->where('status', SaleStatus::Pending)])
            ->orderBy('name')
            ->get()
            ->map(fn ($store): array => [
                'id' => $store->id,
                'name' => $store->name,
                'role' => $store->pivot->role,
                'pending_sales_count' => $store->pending_sales_count,
            ]);

        return Inertia::render('stores/index', ['stores' => $stores]);
    }

    public function create(): Response
    {
        return Inertia::render('stores/create');
    }

    public function store(StoreRequest $request, CreateStoreWithOwner $createStore): RedirectResponse
    {
        $store = $createStore->handle(
            $request->user(),
            $request->validated('name'),
            $request->validated('payment_key'),
        );

        return to_route('store.dashboard', $store)->with('success', 'Tienda creada. ¡Ahora agrega tus productos!');
    }
}
