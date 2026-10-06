<?php

namespace Tests\Feature\Admin;

use App\Enums\MovementType;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\InteractsWithStores;
use Tests\TestCase;

class ProductManagementTest extends TestCase
{
    use InteractsWithStores, RefreshDatabase;

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function validProduct(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Agua 600ml',
            'barcode' => '7701234567890',
            'price' => 2500,
            'cost' => 1500,
            'min_stock' => 3,
            'is_active' => true,
            'initial_stock' => 12,
        ], $overrides);
    }

    public function test_creating_a_product_with_initial_stock_records_a_restock_movement(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);

        $this->actingAs($user)->post(route('store.products.store', $store), $this->validProduct())
            ->assertRedirect(route('store.products.index', $store));

        $product = Product::firstOrFail();
        $this->assertSame($store->id, $product->store_id);
        $this->assertSame(12, $product->stock);
        $movement = InventoryMovement::firstOrFail();
        $this->assertSame(MovementType::Restock, $movement->type);
        $this->assertSame(12, $movement->quantity);
    }

    public function test_barcode_must_be_unique_within_the_store_but_can_repeat_across_stores(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        $otherStore = $this->createStoreFor($user);
        Product::factory()->for($store)->create(['barcode' => '123']);

        $this->actingAs($user)->post(route('store.products.store', $store), $this->validProduct(['barcode' => '123']))
            ->assertSessionHasErrors('barcode');

        $this->actingAs($user)->post(route('store.products.store', $otherStore), $this->validProduct(['barcode' => '123']))
            ->assertSessionHasNoErrors();
    }

    public function test_barcode_and_cost_are_optional(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);

        $this->actingAs($user)->post(route('store.products.store', $store), $this->validProduct(['barcode' => '', 'cost' => '', 'initial_stock' => 0]))
            ->assertSessionHasNoErrors();

        $product = Product::firstOrFail();
        $this->assertNull($product->barcode);
        $this->assertNull($product->cost);
        $this->assertSame(0, InventoryMovement::count());
    }

    public function test_category_must_belong_to_the_same_store(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        $foreignCategory = Category::factory()->create();

        $this->actingAs($user)->post(route('store.products.store', $store), $this->validProduct(['category_id' => $foreignCategory->id]))
            ->assertSessionHasErrors('category_id');
    }

    public function test_updating_a_product_keeps_its_own_barcode_valid(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        $product = Product::factory()->for($store)->create(['barcode' => '999', 'stock' => 4]);

        $this->actingAs($user)->put(route('store.products.update', [$store, $product]), $this->validProduct(['barcode' => '999', 'name' => 'Nuevo nombre']))
            ->assertSessionHasNoErrors();

        $product->refresh();
        $this->assertSame('Nuevo nombre', $product->name);
        $this->assertSame(4, $product->stock);
    }

    public function test_deleting_a_product_soft_deletes_it_and_frees_its_barcode(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        $product = Product::factory()->for($store)->create(['barcode' => '555']);

        $this->actingAs($user)->delete(route('store.products.destroy', [$store, $product]))->assertRedirect();

        $this->assertSoftDeleted($product);
        $this->actingAs($user)->post(route('store.products.store', $store), $this->validProduct(['barcode' => '555']))
            ->assertSessionHasNoErrors();
    }

    public function test_product_photo_is_stored_on_the_public_disk_and_replaced_on_update(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);

        $this->actingAs($user)->post(route('store.products.store', $store), $this->validProduct([
            'image' => UploadedFile::fake()->image('foto.jpg', 200, 200),
        ]));

        $product = Product::firstOrFail();
        Storage::disk('public')->assertExists($product->image_path);
        $oldPath = $product->image_path;

        $this->actingAs($user)->put(route('store.products.update', [$store, $product]), $this->validProduct([
            'image' => UploadedFile::fake()->image('otra.jpg', 200, 200),
        ]));

        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($product->fresh()->image_path);
    }

    public function test_categories_can_be_created_renamed_and_deleted_without_deleting_products(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);

        $this->actingAs($user)->post(route('store.categories.store', $store), ['name' => 'Bebidas']);
        $category = Category::firstOrFail();
        $product = Product::factory()->for($store)->create(['category_id' => $category->id]);

        $this->actingAs($user)->put(route('store.categories.update', [$store, $category]), ['name' => 'Gaseosas']);
        $this->assertSame('Gaseosas', $category->fresh()->name);

        $this->actingAs($user)->delete(route('store.categories.destroy', [$store, $category]));
        $this->assertModelMissing($category);
        $this->assertNull($product->fresh()->category_id);
    }
}
