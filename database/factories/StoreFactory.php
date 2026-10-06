<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Store>
 */
class StoreFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = 'Tienda '.fake()->unique()->word();

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(4)),
            'public_token' => Str::lower(Str::random(10)),
            'payment_key' => '3001234567',
            'payment_instructions' => 'Deja el efectivo en la caja.',
            'accepted_payment_methods' => PaymentMethod::values(),
        ];
    }
}
