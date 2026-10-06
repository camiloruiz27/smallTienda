<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $price = fake()->numberBetween(5, 80) * 100;

        return [
            'store_id' => Store::factory(),
            'category_id' => null,
            'name' => fake()->unique()->words(2, true),
            'barcode' => null,
            'price' => $price,
            'cost' => (int) round($price * 0.7),
            'stock' => 10,
            'min_stock' => 2,
            'image_path' => null,
            'is_active' => true,
        ];
    }

    public function outOfStock(): static
    {
        return $this->state(fn (): array => ['stock' => 0]);
    }

    public function negativeStock(): static
    {
        return $this->state(fn (): array => ['stock' => -3]);
    }

    public function lowStock(): static
    {
        return $this->state(fn (): array => ['stock' => 1, 'min_stock' => 3]);
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => ['is_active' => false]);
    }
}
