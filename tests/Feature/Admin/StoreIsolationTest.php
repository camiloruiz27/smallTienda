<?php

namespace Tests\Feature\Admin;

use App\Models\Product;
use App\Models\Sale;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithStores;
use Tests\TestCase;

class StoreIsolationTest extends TestCase
{
    use InteractsWithStores, RefreshDatabase;

    public function test_guests_are_sent_to_login(): void
    {
        $store = Store::factory()->create();

        $this->get(route('store.dashboard', $store))->assertRedirect(route('login'));
    }

    public function test_members_can_open_their_store_pages(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);

        foreach (['store.dashboard', 'store.products.index', 'store.inventory.index', 'store.sales.index', 'store.reports', 'store.settings.edit', 'store.categories.index'] as $routeName) {
            $this->actingAs($user)->get(route($routeName, $store))->assertOk();
        }
    }

    public function test_non_members_get_404_on_every_store_page(): void
    {
        $user = User::factory()->create();
        $foreignStore = Store::factory()->create();

        foreach (['store.dashboard', 'store.products.index', 'store.inventory.index', 'store.sales.index', 'store.reports', 'store.settings.edit', 'store.categories.index'] as $routeName) {
            $this->actingAs($user)->get(route($routeName, $foreignStore))->assertNotFound();
        }
    }

    public function test_a_product_of_another_store_cannot_be_edited_through_my_store(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        $foreignProduct = Product::factory()->create();

        $this->actingAs($user)->get(route('store.products.edit', [$store, $foreignProduct]))->assertNotFound();
        $this->actingAs($user)->delete(route('store.products.destroy', [$store, $foreignProduct]))->assertNotFound();

        $this->assertNotSoftDeleted($foreignProduct);
    }

    public function test_a_sale_of_another_store_cannot_be_confirmed_or_voided_through_my_store(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        $foreignSale = Sale::factory()->create();

        $this->actingAs($user)->post(route('store.sales.confirm', [$store, $foreignSale]))->assertNotFound();
        $this->actingAs($user)->post(route('store.sales.void', [$store, $foreignSale]))->assertNotFound();
    }

    public function test_shared_props_only_include_the_stores_of_the_user(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        Store::factory()->create(['name' => 'Ajena']);

        $this->actingAs($user)->get(route('store.dashboard', $store))
            ->assertInertia(fn ($page) => $page
                ->has('userStores', 1)
                ->where('currentStore.id', $store->id)
                ->where('currentStore.role', 'owner'));
    }

    public function test_dashboard_redirects_according_to_the_number_of_stores(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('stores.create'));

        $first = $this->createStoreFor($user);
        $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('store.dashboard', $first));

        $this->createStoreFor($user);
        $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('stores.index'));
    }

    public function test_a_user_can_create_a_store_and_becomes_its_owner(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('stores.store'), [
            'name' => 'Tienda Piso 3',
            'payment_key' => '3001234567',
        ])->assertRedirect();

        $store = Store::firstOrFail();
        $this->assertSame('tienda-piso-3', $store->slug);
        $this->assertSame(10, strlen($store->public_token));
        $this->assertTrue($store->isOwnedBy($user));
    }
}
