<?php

namespace Tests\Feature\Shop;

use App\Enums\SaleStatus;
use App\Models\Sale;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithStores;
use Tests\TestCase;

class PaymentClaimTest extends TestCase
{
    use InteractsWithStores, RefreshDatabase;

    public function test_customer_can_say_they_already_paid_a_pending_sale(): void
    {
        $store = Store::factory()->create();
        $sale = Sale::factory()->for($store)->create();

        $this->post(route('shop.paid', [$store->public_token, $sale->code]))
            ->assertRedirect(route('shop.receipt', [$store->public_token, $sale->code]));

        $sale->refresh();
        $this->assertNotNull($sale->paid_claimed_at);
        $this->assertSame(SaleStatus::Pending, $sale->status, 'Claiming a payment must never confirm the sale.');
    }

    public function test_claiming_twice_keeps_the_original_moment(): void
    {
        $store = Store::factory()->create();
        $sale = Sale::factory()->for($store)->create();

        $this->travelTo(now()->subHour());
        $this->post(route('shop.paid', [$store->public_token, $sale->code]));
        $firstClaim = $sale->fresh()->paid_claimed_at;
        $this->travelBack();

        $this->post(route('shop.paid', [$store->public_token, $sale->code]));

        $this->assertTrue($firstClaim->equalTo($sale->fresh()->paid_claimed_at));
    }

    public function test_only_pending_sales_can_be_claimed(): void
    {
        $store = Store::factory()->create();
        $confirmed = Sale::factory()->for($store)->confirmed()->create();
        $voided = Sale::factory()->for($store)->voided()->create();

        $this->post(route('shop.paid', [$store->public_token, $confirmed->code]));
        $this->post(route('shop.paid', [$store->public_token, $voided->code]));

        $this->assertNull($confirmed->fresh()->paid_claimed_at);
        $this->assertNull($voided->fresh()->paid_claimed_at);
    }

    public function test_a_sale_of_another_store_cannot_be_claimed_through_this_store_token(): void
    {
        $store = Store::factory()->create();
        $otherSale = Sale::factory()->create();

        $this->post(route('shop.paid', [$store->public_token, $otherSale->code]))->assertNotFound();

        $this->assertNull($otherSale->fresh()->paid_claimed_at);
    }

    public function test_the_receipt_reports_whether_the_payment_was_claimed(): void
    {
        $store = Store::factory()->create();
        $sale = Sale::factory()->for($store)->create();

        $this->get(route('shop.receipt', [$store->public_token, $sale->code]))
            ->assertInertia(fn ($page) => $page->where('sale.paid_claimed', false));

        $this->post(route('shop.paid', [$store->public_token, $sale->code]));

        $this->get(route('shop.receipt', [$store->public_token, $sale->code]))
            ->assertInertia(fn ($page) => $page->where('sale.paid_claimed', true));
    }

    public function test_the_owner_sees_claimed_sales_first_and_still_confirms_them_manually(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        $older = Sale::factory()->for($store)->create(['code' => 'OLDER222', 'created_at' => now()->subHour(), 'paid_claimed_at' => now()]);
        $newer = Sale::factory()->for($store)->create(['code' => 'NEWER222', 'created_at' => now()]);

        $this->actingAs($user)->get(route('store.sales.index', $store))
            ->assertInertia(fn ($page) => $page
                ->where('sales.data.0.code', 'OLDER222')
                ->where('sales.data.0.paid_claimed', true)
                ->where('sales.data.1.code', 'NEWER222')
                ->where('sales.data.1.paid_claimed', false));

        $this->actingAs($user)->post(route('store.sales.confirm', [$store, $older]));

        $this->assertSame(SaleStatus::Confirmed, $older->fresh()->status);
        $this->assertSame(SaleStatus::Pending, $newer->fresh()->status);
    }

    public function test_claiming_is_rate_limited(): void
    {
        $store = Store::factory()->create();
        $sale = Sale::factory()->for($store)->create();

        foreach (range(1, 30) as $ignored) {
            $this->post(route('shop.paid', [$store->public_token, $sale->code]))->assertRedirect();
        }

        $this->post(route('shop.paid', [$store->public_token, $sale->code]))->assertStatus(429);
    }
}
