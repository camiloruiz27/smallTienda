<?php

namespace Tests\Feature\Admin;

use App\Enums\StoreRole;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\InteractsWithStores;
use Tests\TestCase;

class StoreSettingsTest extends TestCase
{
    use InteractsWithStores, RefreshDatabase;

    public function test_owner_can_update_settings(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);

        $this->actingAs($user)->put(route('store.settings.update', $store), [
            'name' => 'Mi Tienda',
            'payment_key' => '@tienda',
            'payment_instructions' => 'Deja el efectivo en la caja.',
            'accepted_payment_methods' => ['cash', 'breb'],
        ])->assertSessionHasNoErrors();

        $store->refresh();
        $this->assertSame('Mi Tienda', $store->name);
        $this->assertSame(['cash', 'breb'], $store->accepted_payment_methods);
        $this->assertSame('@tienda', $store->payment_key);
    }

    public function test_owner_can_upload_replace_and_remove_the_payment_qr(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        $base = ['name' => 'Mi Tienda', 'accepted_payment_methods' => ['cash', 'breb']];

        $this->actingAs($user)->put(route('store.settings.update', $store), $base + [
            'payment_qr' => UploadedFile::fake()->image('qr.png', 300, 300),
        ])->assertSessionHasNoErrors();

        $firstPath = $store->fresh()->payment_qr_path;
        Storage::disk('public')->assertExists($firstPath);

        $this->actingAs($user)->put(route('store.settings.update', $store), $base + [
            'payment_qr' => UploadedFile::fake()->image('otro.png', 300, 300),
        ]);

        $secondPath = $store->fresh()->payment_qr_path;
        Storage::disk('public')->assertMissing($firstPath);
        Storage::disk('public')->assertExists($secondPath);

        $this->actingAs($user)->put(route('store.settings.update', $store), $base + ['remove_payment_qr' => true]);

        $this->assertNull($store->fresh()->payment_qr_path);
        Storage::disk('public')->assertMissing($secondPath);
    }

    public function test_the_payment_qr_must_be_an_image(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);

        $this->actingAs($user)->put(route('store.settings.update', $store), [
            'name' => 'Mi Tienda',
            'accepted_payment_methods' => ['cash'],
            'payment_qr' => UploadedFile::fake()->create('qr.pdf', 10, 'application/pdf'),
        ])->assertSessionHasErrors('payment_qr');
    }

    public function test_at_least_one_payment_method_is_required(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);

        $this->actingAs($user)->put(route('store.settings.update', $store), [
            'name' => 'Mi Tienda',
            'accepted_payment_methods' => [],
        ])->assertSessionHasErrors('accepted_payment_methods');
    }

    public function test_regenerating_the_token_invalidates_the_previous_public_link(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        $oldToken = $store->public_token;

        $this->actingAs($user)->post(route('store.settings.token', $store))->assertRedirect();

        $this->assertNotSame($oldToken, $store->fresh()->public_token);
        $this->get(route('shop.show', $oldToken))->assertNotFound();
        $this->get(route('shop.show', $store->fresh()->public_token))->assertOk();
    }

    public function test_owner_can_delete_the_store_with_their_password_and_its_data_goes_with_it(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);
        $product = Product::factory()->for($store)->create();

        $this->actingAs($user)->delete(route('store.settings.destroy', $store), ['password' => 'password'])
            ->assertRedirect(route('dashboard'));

        $this->assertModelMissing($store);
        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    public function test_deleting_the_store_requires_the_correct_password(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);

        $this->actingAs($user)->delete(route('store.settings.destroy', $store), ['password' => 'wrong'])
            ->assertSessionHasErrors('password');

        $this->assertModelExists($store);
    }

    public function test_managers_cannot_delete_the_store(): void
    {
        $manager = User::factory()->create();
        $store = $this->createStoreFor($manager, StoreRole::Manager);

        $this->actingAs($manager)->delete(route('store.settings.destroy', $store), ['password' => 'password'])->assertForbidden();

        $this->assertModelExists($store);
    }

    public function test_an_account_that_owns_a_store_cannot_be_deleted_until_the_store_is_removed(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreFor($user);

        $this->actingAs($user)->delete(route('profile.destroy'), ['password' => 'password'])
            ->assertSessionHasErrors('password');

        $this->assertModelExists($user);

        $store->delete();

        $this->actingAs($user)->delete(route('profile.destroy'), ['password' => 'password'])->assertRedirect('/');
        $this->assertModelMissing($user);
    }

    public function test_managers_cannot_change_settings_or_rotate_the_token(): void
    {
        $manager = User::factory()->create();
        $store = $this->createStoreFor($manager, StoreRole::Manager);
        $token = $store->public_token;

        $this->actingAs($manager)->put(route('store.settings.update', $store), [
            'name' => 'Hackeada',
            'accepted_payment_methods' => ['cash'],
        ])->assertForbidden();
        $this->actingAs($manager)->post(route('store.settings.token', $store))->assertForbidden();

        $this->assertSame($token, $store->fresh()->public_token);
        $this->actingAs($manager)->get(route('store.settings.edit', $store))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('canEdit', false));
    }
}
