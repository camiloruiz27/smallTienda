<?php

namespace Tests\Concerns;

use App\Enums\StoreRole;
use App\Models\Store;
use App\Models\User;

trait InteractsWithStores
{
    /**
     * Create a store the given user belongs to.
     */
    protected function createStoreFor(User $user, StoreRole $role = StoreRole::Owner): Store
    {
        $store = Store::factory()->create();
        $store->members()->attach($user, ['role' => $role->value]);

        return $store;
    }
}
