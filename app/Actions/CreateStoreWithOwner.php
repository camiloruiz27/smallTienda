<?php

namespace App\Actions;

use App\Enums\PaymentMethod;
use App\Enums\StoreRole;
use App\Models\Store;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateStoreWithOwner
{
    /**
     * Create a store and attach the given user as its owner.
     */
    public function handle(User $owner, string $name, ?string $paymentKey = null): Store
    {
        return DB::transaction(function () use ($owner, $name, $paymentKey): Store {
            $store = Store::create([
                'name' => $name,
                'slug' => $this->uniqueSlug($name),
                'public_token' => self::newPublicToken(),
                'payment_key' => $paymentKey,
                'accepted_payment_methods' => PaymentMethod::values(),
            ]);

            $store->members()->attach($owner, ['role' => StoreRole::Owner->value]);

            return $store;
        });
    }

    /**
     * Generate a public token that is not used by any other store.
     */
    public static function newPublicToken(): string
    {
        do {
            $token = Str::lower(Str::random(10));
        } while (Store::where('public_token', $token)->exists());

        return $token;
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'tienda';
        $slug = $base;
        $suffix = 2;

        while (Store::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
