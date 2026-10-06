<?php

namespace Tests\Feature\Admin;

use App\Actions\RecordSale;
use App\Enums\MovementType;
use App\Enums\PaymentMethod;
use App\Enums\SaleStatus;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithStores;
use Tests\TestCase;

class SaleManagementTest extends TestCase
{
    use InteractsWithStores, RefreshDatabase;

    public function test_owner_confirms_a_pending_sale(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        $sale = Sale::factory()->for($store)->create();

        $this->actingAs($user)->post(route('store.sales.confirm', [$store, $sale]))->assertRedirect();

        $sale->refresh();
        $this->assertSame(SaleStatus::Confirmed, $sale->status);
        $this->assertSame($user->id, $sale->confirmed_by);
        $this->assertNotNull($sale->confirmed_at);
    }

    public function test_voiding_a_sale_puts_the_items_back_into_stock_once(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        $product = Product::factory()->for($store)->create(['stock' => 10]);

        $sale = app(RecordSale::class)->handle(
            $store,
            [['product_id' => $product->id, 'quantity' => 4]],
            PaymentMethod::Cash,
            (string) Str::uuid(),
        );
        $this->assertSame(6, $product->fresh()->stock);

        $this->actingAs($user)->post(route('store.sales.void', [$store, $sale]))->assertRedirect();
        $this->actingAs($user)->post(route('store.sales.void', [$store, $sale]))->assertRedirect();

        $this->assertSame(10, $product->fresh()->stock);
        $this->assertSame(SaleStatus::Voided, $sale->fresh()->status);
        $this->assertSame(1, InventoryMovement::where('type', MovementType::Void)->count());
    }

    public function test_a_voided_sale_cannot_be_confirmed(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        $sale = Sale::factory()->for($store)->voided()->create();

        $this->actingAs($user)->post(route('store.sales.confirm', [$store, $sale]));

        $this->assertSame(SaleStatus::Voided, $sale->fresh()->status);
    }

    public function test_sales_list_is_filtered_by_status_and_defaults_to_pending(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        Sale::factory()->for($store)->count(2)->create();
        Sale::factory()->for($store)->confirmed()->create();

        $this->actingAs($user)->get(route('store.sales.index', $store))
            ->assertInertia(fn ($page) => $page->where('status', 'pending')->has('sales.data', 2)->where('counts.pending', 2));

        $this->actingAs($user)->get(route('store.sales.index', [$store, 'status' => 'confirmed']))
            ->assertInertia(fn ($page) => $page->where('status', 'confirmed')->has('sales.data', 1));
    }

    public function test_dashboard_summarizes_today_without_counting_voided_sales(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        Sale::factory()->for($store)->create(['total' => 3000]);
        Sale::factory()->for($store)->confirmed()->create(['total' => 2000]);
        Sale::factory()->for($store)->voided()->create(['total' => 9000]);
        Product::factory()->for($store)->negativeStock()->create();
        Product::factory()->for($store)->lowStock()->create();

        $this->actingAs($user)->get(route('store.dashboard', $store))
            ->assertInertia(fn ($page) => $page
                ->where('stats.today_total', 5000)
                ->where('stats.today_count', 2)
                ->where('stats.pending_count', 1)
                ->where('stats.negative_stock_count', 1)
                ->where('stats.low_stock_count', 1));
    }
}
