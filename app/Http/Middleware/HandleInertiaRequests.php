<?php

namespace App\Http\Middleware;

use App\Enums\SaleStatus;
use App\Models\Store;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * The store being managed, only exposed when the signed-in user is a member of it.
     *
     * @return array{id: int, name: string, public_token: string, role: string, pending_sales_count: int}|null
     */
    private function currentStore(Request $request): ?array
    {
        $store = $request->route('store');
        $user = $request->user();

        if (! $store instanceof Store || $user === null) {
            return null;
        }

        $membership = $user->stores()->whereKey($store->getKey())->first();

        if ($membership === null) {
            return null;
        }

        return [
            'id' => $store->id,
            'name' => $store->name,
            'public_token' => $store->public_token,
            'role' => $membership->pivot->role,
            'pending_sales_count' => $store->sales()->where('status', SaleStatus::Pending)->count(),
        ];
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return array_merge(parent::share($request), [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
            'userStores' => fn () => $request->user()
                ? $request->user()->stores()->orderBy('name')->get(['stores.id', 'stores.name'])->map->only(['id', 'name'])->values()
                : [],
            'currentStore' => fn () => $this->currentStore($request),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ]);
    }
}
