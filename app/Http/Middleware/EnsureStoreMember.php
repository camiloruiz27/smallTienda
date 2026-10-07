<?php

namespace App\Http\Middleware;

use App\Models\Store;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Only lets through users that belong to the store in the route. Non-members get a 404 so that
 * the existence of other stores is not revealed.
 */
class EnsureStoreMember
{
    public function handle(Request $request, Closure $next): Response
    {
        $store = $request->route('store');
        $user = $request->user();

        if (! $store instanceof Store || $user === null || ! $user->stores()->whereKey($store->getKey())->exists()) {
            abort(404);
        }

        return $next($request);
    }
}
