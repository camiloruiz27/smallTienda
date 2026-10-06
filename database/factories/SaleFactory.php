<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use App\Enums\SaleStatus;
use App\Models\Sale;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Sale>
 */
class SaleFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'store_id' => Store::factory(),
            'submission_id' => (string) Str::uuid(),
            'code' => Str::upper(Str::random(8)),
            'customer_name' => fake()->firstName(),
            'customer_phone' => null,
            'payment_method' => PaymentMethod::Cash,
            'status' => SaleStatus::Pending,
            'total' => 0,
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn (): array => [
            'status' => SaleStatus::Confirmed,
            'confirmed_at' => now(),
        ]);
    }

    public function voided(): static
    {
        return $this->state(fn (): array => ['status' => SaleStatus::Voided]);
    }
}
