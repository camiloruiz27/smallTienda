<?php

namespace Tests\Feature\Admin;

use App\Actions\RecordMovement;
use App\Enums\MovementType;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\Concerns\InteractsWithStores;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use InteractsWithStores, RefreshDatabase;

    public function test_restock_batch_increases_stock_records_movements_and_updates_cost(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        $first = Product::factory()->for($store)->create(['stock' => 1, 'cost' => 500]);
        $second = Product::factory()->for($store)->create(['stock' => 0]);

        $this->actingAs($user)->post(route('store.inventory.restock.store', $store), [
            'note' => 'Compra plaza',
            'items' => [
                ['product_id' => $first->id, 'quantity' => 10, 'unit_cost' => 650],
                ['product_id' => $second->id, 'quantity' => 4],
            ],
        ])->assertRedirect(route('store.inventory.index', $store));

        $this->assertSame(11, $first->fresh()->stock);
        $this->assertSame(650, $first->fresh()->cost);
        $this->assertSame(4, $second->fresh()->stock);
        $this->assertSame(2, InventoryMovement::where('type', MovementType::Restock)->count());
        $this->assertSame($user->id, InventoryMovement::first()->user_id);
    }

    public function test_restock_rejects_products_of_another_store_without_changing_anything(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        $mine = Product::factory()->for($store)->create(['stock' => 1]);
        $foreign = Product::factory()->create(['stock' => 1]);

        $this->actingAs($user)->post(route('store.inventory.restock.store', $store), [
            'items' => [
                ['product_id' => $mine->id, 'quantity' => 5],
                ['product_id' => $foreign->id, 'quantity' => 5],
            ],
        ])->assertSessionHasErrors('items.1.product_id');

        $this->assertSame(1, $mine->fresh()->stock);
        $this->assertSame(1, $foreign->fresh()->stock);
        $this->assertSame(0, InventoryMovement::count());
    }

    public function test_physical_count_only_creates_movements_for_products_that_differ(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        $matching = Product::factory()->for($store)->create(['stock' => 5]);
        $missing = Product::factory()->for($store)->create(['stock' => 8]);
        $negative = Product::factory()->for($store)->negativeStock()->create();

        $this->actingAs($user)->post(route('store.inventory.count.store', $store), [
            'items' => [
                ['product_id' => $matching->id, 'counted' => 5],
                ['product_id' => $missing->id, 'counted' => 6],
                ['product_id' => $negative->id, 'counted' => 0],
            ],
        ])->assertRedirect(route('store.inventory.index', $store));

        $this->assertSame(5, $matching->fresh()->stock);
        $this->assertSame(6, $missing->fresh()->stock);
        $this->assertSame(0, $negative->fresh()->stock);
        $this->assertSame(2, InventoryMovement::where('type', MovementType::Count)->count());
        $this->assertSame(-2, InventoryMovement::where('product_id', $missing->id)->first()->quantity);
        $this->assertSame(3, InventoryMovement::where('product_id', $negative->id)->first()->quantity);
    }

    public function test_waste_always_decreases_stock(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        $product = Product::factory()->for($store)->create(['stock' => 6]);

        $this->actingAs($user)->post(route('store.inventory.adjust', [$store, $product]), [
            'type' => 'waste',
            'quantity' => 2,
            'note' => 'Vencido',
        ])->assertRedirect();

        $this->assertSame(4, $product->fresh()->stock);
        $this->assertSame(MovementType::Waste, InventoryMovement::firstOrFail()->type);
    }

    public function test_adjustment_requires_a_direction_and_can_add_or_remove(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        $product = Product::factory()->for($store)->create(['stock' => 6]);

        $this->actingAs($user)->post(route('store.inventory.adjust', [$store, $product]), [
            'type' => 'adjustment',
            'quantity' => 1,
        ])->assertSessionHasErrors('direction');

        $this->actingAs($user)->post(route('store.inventory.adjust', [$store, $product]), [
            'type' => 'adjustment',
            'direction' => 'remove',
            'quantity' => 4,
        ]);
        $this->actingAs($user)->post(route('store.inventory.adjust', [$store, $product]), [
            'type' => 'adjustment',
            'direction' => 'add',
            'quantity' => 1,
        ]);

        $this->assertSame(3, $product->fresh()->stock);
    }

    public function test_movement_signs_are_enforced_by_type(): void
    {
        $product = Product::factory()->create();
        $recordMovement = app(RecordMovement::class);

        $this->expectException(InvalidArgumentException::class);

        $recordMovement->handle($product, MovementType::Restock, -1);
    }

    public function test_zero_quantity_movements_are_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);

        app(RecordMovement::class)->handle(Product::factory()->create(), MovementType::Adjustment, 0);
    }

    public function test_low_and_negative_filters_on_the_inventory_page(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        Product::factory()->for($store)->create(['name' => 'Normal', 'stock' => 20, 'min_stock' => 2]);
        Product::factory()->for($store)->lowStock()->create(['name' => 'Poco']);
        Product::factory()->for($store)->negativeStock()->create(['name' => 'Negativo']);

        $this->actingAs($user)->get(route('store.inventory.index', [$store, 'filter' => 'low']))
            ->assertInertia(fn ($page) => $page->has('products', 1)->where('products.0.name', 'Poco')->where('counts.negative', 1));

        $this->actingAs($user)->get(route('store.inventory.index', [$store, 'filter' => 'negative']))
            ->assertInertia(fn ($page) => $page->has('products', 1)->where('products.0.name', 'Negativo'));
    }
}
