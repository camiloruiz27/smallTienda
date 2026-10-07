<?php

namespace Tests\Feature\Shop;

use App\Enums\MovementType;
use App\Enums\SaleStatus;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(Product $product, int $quantity = 2, array $overrides = []): array
    {
        return array_merge([
            'submission_id' => (string) Str::uuid(),
            'items' => [['product_id' => $product->id, 'quantity' => $quantity]],
            'payment_method' => 'cash',
            'customer_name' => 'Ana',
        ], $overrides);
    }

    public function test_guest_can_view_the_public_shop_without_exposing_exact_stock(): void
    {
        $store = Store::factory()->create();
        Product::factory()->for($store)->create(['name' => 'Galleta', 'stock' => 7]);
        Product::factory()->for($store)->inactive()->create(['name' => 'Oculto']);

        $this->get(route('shop.show', $store->public_token))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('shop/index')
                ->has('products', 1)
                ->where('products.0.name', 'Galleta')
                ->missing('products.0.stock'));
    }

    public function test_unknown_public_token_returns_404(): void
    {
        $this->get(route('shop.show', 'no-existe'))->assertNotFound();
    }

    public function test_checkout_creates_sale_snapshots_prices_and_discounts_stock(): void
    {
        $store = Store::factory()->create();
        $product = Product::factory()->for($store)->create(['price' => 2500, 'stock' => 10]);

        $response = $this->post(route('shop.checkout', $store->public_token), $this->payload($product, 3));

        $sale = Sale::firstOrFail();
        $response->assertRedirect(route('shop.receipt', [$store->public_token, $sale->code]));

        $this->assertSame(SaleStatus::Pending, $sale->status);
        $this->assertSame(7500, $sale->total);
        $this->assertSame($product->name, $sale->items->first()->product_name);
        $this->assertSame(7, $product->fresh()->stock);

        $movement = InventoryMovement::firstOrFail();
        $this->assertSame(MovementType::Sale, $movement->type);
        $this->assertSame(-3, $movement->quantity);
        $this->assertSame($sale->id, $movement->sale_id);
    }

    public function test_repeating_the_same_submission_does_not_duplicate_the_sale_or_discount_stock_twice(): void
    {
        $store = Store::factory()->create();
        $product = Product::factory()->for($store)->create(['stock' => 10]);
        $payload = $this->payload($product, 2);

        $this->post(route('shop.checkout', $store->public_token), $payload);
        $this->post(route('shop.checkout', $store->public_token), $payload);

        $this->assertSame(1, Sale::count());
        $this->assertSame(8, $product->fresh()->stock);
    }

    public function test_purchase_is_accepted_when_recorded_stock_is_zero_and_stock_goes_negative(): void
    {
        $store = Store::factory()->create();
        $product = Product::factory()->for($store)->outOfStock()->create();

        $this->post(route('shop.checkout', $store->public_token), $this->payload($product, 1))
            ->assertSessionHasNoErrors();

        $this->assertSame(1, Sale::count());
        $this->assertSame(-1, $product->fresh()->stock);
    }

    public function test_the_same_product_listed_twice_is_merged_into_one_line(): void
    {
        $store = Store::factory()->create();
        $product = Product::factory()->for($store)->create(['price' => 1000, 'stock' => 10]);

        $this->post(route('shop.checkout', $store->public_token), $this->payload($product, 1, [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ]));

        $sale = Sale::firstOrFail();
        $this->assertCount(1, $sale->items);
        $this->assertSame(3, $sale->items->first()->quantity);
        $this->assertSame(3000, $sale->total);
    }

    public function test_inactive_products_cannot_be_purchased(): void
    {
        $store = Store::factory()->create();
        $product = Product::factory()->for($store)->inactive()->create();

        $this->post(route('shop.checkout', $store->public_token), $this->payload($product))
            ->assertSessionHasErrors('items');

        $this->assertSame(0, Sale::count());
    }

    public function test_products_from_another_store_cannot_be_purchased(): void
    {
        $store = Store::factory()->create();
        $otherProduct = Product::factory()->create(['stock' => 10]);

        $this->post(route('shop.checkout', $store->public_token), $this->payload($otherProduct))
            ->assertSessionHasErrors('items');

        $this->assertSame(0, Sale::count());
        $this->assertSame(10, $otherProduct->fresh()->stock);
    }

    public function test_payment_method_must_be_accepted_by_the_store(): void
    {
        $store = Store::factory()->create(['accepted_payment_methods' => ['cash']]);
        $product = Product::factory()->for($store)->create();

        $this->post(route('shop.checkout', $store->public_token), $this->payload($product, 1, ['payment_method' => 'nequi']))
            ->assertSessionHasErrors('payment_method');
    }

    public function test_quantity_is_capped_per_item(): void
    {
        $store = Store::factory()->create();
        $product = Product::factory()->for($store)->create();

        $this->post(route('shop.checkout', $store->public_token), $this->payload($product, 21))
            ->assertSessionHasErrors('items.0.quantity');
    }

    public function test_filled_honeypot_field_is_rejected(): void
    {
        $store = Store::factory()->create();
        $product = Product::factory()->for($store)->create();

        $this->post(route('shop.checkout', $store->public_token), $this->payload($product, 1, ['website' => 'http://spam']))
            ->assertSessionHasErrors('website');

        $this->assertSame(0, Sale::count());
    }

    public function test_checkout_is_rate_limited(): void
    {
        $store = Store::factory()->create();
        $product = Product::factory()->for($store)->create(['stock' => 1000]);

        foreach (range(1, 10) as $ignored) {
            $this->post(route('shop.checkout', $store->public_token), $this->payload($product, 1))->assertRedirect();
        }

        $this->post(route('shop.checkout', $store->public_token), $this->payload($product, 1))->assertStatus(429);
    }

    public function test_receipt_shows_payment_instructions(): void
    {
        $store = Store::factory()->create([
            'payment_key' => '@mitienda',
            'payment_qr_path' => 'stores/1/qr.png',
            'payment_instructions' => 'Deja el efectivo en la caja.',
        ]);
        $sale = Sale::factory()->for($store)->create();

        $this->get(route('shop.receipt', [$store->public_token, $sale->code]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('shop/receipt')
                ->where('store.payment_key', '@mitienda')
                ->where('store.payment_qr_url', Storage::disk('public')->url('stores/1/qr.png'))
                ->where('store.payment_instructions', 'Deja el efectivo en la caja.')
                ->where('sale.code', $sale->code));
    }

    public function test_receipt_of_another_store_is_not_reachable_through_this_store_token(): void
    {
        $store = Store::factory()->create();
        $otherSale = Sale::factory()->create();

        $this->get(route('shop.receipt', [$store->public_token, $otherSale->code]))->assertNotFound();
    }
}
