<?php

namespace Tests\Feature\Notifications;

use App\Enums\StoreRole;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Store;
use App\Models\User;
use App\Notifications\LowStockNotification;
use App\Notifications\NewSaleNotification;
use App\Notifications\PaymentClaimedNotification;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Symfony\Component\Mailer\Exception\TransportException;
use Tests\Concerns\InteractsWithStores;
use Tests\TestCase;

class EmailNotificationsTest extends TestCase
{
    use InteractsWithStores, RefreshDatabase;

    /**
     * A store with a verified owner and an unverified manager.
     *
     * @param  array<string, mixed>  $storeAttributes
     * @return array{0: Store, 1: User, 2: User}
     */
    private function storeWithTeam(array $storeAttributes = []): array
    {
        $owner = User::factory()->create();
        $manager = User::factory()->unverified()->create();
        $store = Store::factory()->create($storeAttributes);
        $store->members()->attach($owner, ['role' => StoreRole::Owner->value]);
        $store->members()->attach($manager, ['role' => StoreRole::Manager->value]);

        return [$store, $owner, $manager];
    }

    /**
     * @return array<string, mixed>
     */
    private function checkoutPayload(Product $product, int $quantity = 1, ?string $submissionId = null): array
    {
        return [
            'submission_id' => $submissionId ?? (string) Str::uuid(),
            'items' => [['product_id' => $product->id, 'quantity' => $quantity]],
            'payment_method' => 'breb',
            'customer_name' => 'Ana',
        ];
    }

    public function test_a_new_purchase_is_emailed_only_to_verified_members_and_only_once(): void
    {
        Notification::fake();
        [$store, $owner, $manager] = $this->storeWithTeam();
        $product = Product::factory()->for($store)->create(['stock' => 10]);
        $payload = $this->checkoutPayload($product, 2);

        $this->post(route('shop.checkout', $store->public_token), $payload)->assertRedirect();
        $this->post(route('shop.checkout', $store->public_token), $payload)->assertRedirect();

        Notification::assertSentTo($owner, NewSaleNotification::class, fn (NewSaleNotification $notification) => $notification->sale->is(Sale::firstOrFail()));
        Notification::assertNotSentTo($manager, NewSaleNotification::class);
        Notification::assertSentTimes(NewSaleNotification::class, 1);
    }

    public function test_purchase_emails_can_be_switched_off_per_store(): void
    {
        Notification::fake();
        [$store] = $this->storeWithTeam(['notify_new_sales' => false, 'notify_low_stock' => false]);
        $product = Product::factory()->for($store)->create(['stock' => 3, 'min_stock' => 3]);

        $this->post(route('shop.checkout', $store->public_token), $this->checkoutPayload($product))->assertRedirect();

        Notification::assertNothingSent();
    }

    public function test_low_stock_is_emailed_only_when_a_purchase_crosses_the_minimum(): void
    {
        Notification::fake();
        [$store, $owner] = $this->storeWithTeam(['notify_new_sales' => false]);
        $nearMinimum = Product::factory()->for($store)->create(['stock' => 4, 'min_stock' => 3]);
        $plenty = Product::factory()->for($store)->create(['stock' => 50, 'min_stock' => 3]);

        $this->post(route('shop.checkout', $store->public_token), [
            'submission_id' => (string) Str::uuid(),
            'items' => [
                ['product_id' => $nearMinimum->id, 'quantity' => 2],
                ['product_id' => $plenty->id, 'quantity' => 1],
            ],
            'payment_method' => 'cash',
        ])->assertRedirect();

        Notification::assertSentTo(
            $owner,
            LowStockNotification::class,
            fn (LowStockNotification $notification) => $notification->products->pluck('id')->all() === [$nearMinimum->id],
        );

        // Already below the minimum: the next purchase must not send the same alert again.
        $this->post(route('shop.checkout', $store->public_token), $this->checkoutPayload($nearMinimum))->assertRedirect();

        Notification::assertSentTimes(LowStockNotification::class, 1);
    }

    public function test_payment_claims_email_the_team_once_and_respect_the_switch(): void
    {
        Notification::fake();
        [$store, $owner, $manager] = $this->storeWithTeam();
        $sale = Sale::factory()->for($store)->create();

        $this->post(route('shop.paid', [$store->public_token, $sale->code]));
        $this->post(route('shop.paid', [$store->public_token, $sale->code]));

        Notification::assertSentTo($owner, PaymentClaimedNotification::class);
        Notification::assertNotSentTo($manager, PaymentClaimedNotification::class);
        Notification::assertSentTimes(PaymentClaimedNotification::class, 1);

        $silentStore = Store::factory()->create(['notify_payment_claims' => false]);
        $silentStore->members()->attach($owner, ['role' => StoreRole::Owner->value]);
        $silentSale = Sale::factory()->for($silentStore)->create();

        $this->post(route('shop.paid', [$silentStore->public_token, $silentSale->code]));

        Notification::assertSentTimes(PaymentClaimedNotification::class, 1);
    }

    public function test_a_failing_mail_server_never_breaks_the_purchase(): void
    {
        Exceptions::fake();
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => '127.0.0.1',
            'mail.mailers.smtp.port' => 1,
        ]);
        [$store] = $this->storeWithTeam();
        $product = Product::factory()->for($store)->create(['stock' => 10]);

        $this->post(route('shop.checkout', $store->public_token), $this->checkoutPayload($product))
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertSame(1, Sale::count());
        Exceptions::assertReported(fn (TransportException $exception) => true);
    }

    public function test_the_emails_are_written_in_spanish_with_the_key_details(): void
    {
        app()->setLocale('es');
        [$store, $owner] = $this->storeWithTeam();
        $product = Product::factory()->for($store)->create(['name' => 'Agua 600 ml', 'stock' => 2, 'min_stock' => 3]);
        $sale = Sale::factory()->for($store)->create(['code' => 'ABCD2345', 'customer_name' => 'Ana', 'total' => 6000]);
        SaleItem::factory()->create(['sale_id' => $sale->id, 'product_id' => $product->id, 'product_name' => 'Agua 600 ml', 'quantity' => 3, 'unit_price' => 2000, 'subtotal' => 6000]);

        $newSale = (string) (new NewSaleNotification($sale))->toMail($owner)->render();
        $this->assertStringContainsString('Ana', $newSale);
        $this->assertStringContainsString('$ 6.000', $newSale);
        $this->assertStringContainsString('3 × Agua 600 ml', $newSale);
        $this->assertStringContainsString('ABCD2345', $newSale);
        $this->assertStringContainsString(route('store.sales.index', $store), $newSale);

        $claimed = (new PaymentClaimedNotification($sale))->toMail($owner);
        $this->assertStringContainsString('Ana dice que ya pagó', $claimed->subject);
        $this->assertStringContainsString('ABCD2345', (string) $claimed->render());

        $lowStock = (new LowStockNotification($store, collect([$product])))->toMail($owner);
        $this->assertStringContainsString('Stock bajo', $lowStock->subject);
        $this->assertStringContainsString('Agua 600 ml — quedan 2, avisar en 3', (string) $lowStock->render());
    }

    public function test_registration_sends_the_verification_email(): void
    {
        Notification::fake();

        $this->post('/register', [
            'name' => 'Dueña Nueva',
            'email' => 'nueva@example.test',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $user = User::where('email', 'nueva@example.test')->firstOrFail();
        $this->assertFalse($user->hasVerifiedEmail());
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_changing_the_email_requires_verifying_the_new_address(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->actingAs($user)->patch(route('profile.update'), ['name' => $user->name, 'email' => 'otro@example.test']);

        $this->assertNull($user->fresh()->email_verified_at);
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_forgot_password_email_is_sent_in_spanish(): void
    {
        app()->setLocale('es');
        Notification::fake();
        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email]);

        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user) {
            return $notification->toMail($user)->subject === 'Restablecer tu contraseña';
        });
    }

    public function test_owner_can_choose_which_alerts_to_receive(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);

        $this->actingAs($user)->get(route('store.settings.edit', $store))
            ->assertInertia(fn ($page) => $page
                ->where('settings.notify_new_sales', true)
                ->where('settings.notify_payment_claims', true)
                ->where('settings.notify_low_stock', true));

        $this->actingAs($user)->put(route('store.settings.update', $store), [
            'name' => $store->name,
            'accepted_payment_methods' => ['cash'],
            'notify_new_sales' => false,
            'notify_payment_claims' => true,
            'notify_low_stock' => false,
        ])->assertSessionHasNoErrors();

        $store->refresh();
        $this->assertFalse($store->notify_new_sales);
        $this->assertTrue($store->notify_payment_claims);
        $this->assertFalse($store->notify_low_stock);
    }

    public function test_the_mail_test_command_sends_a_message(): void
    {
        $this->artisan('mail:test', ['to' => 'prueba@example.test'])->assertSuccessful();

        $this->assertCount(1, app('mailer')->getSymfonyTransport()->messages());
    }
}
