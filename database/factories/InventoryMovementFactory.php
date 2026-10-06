<?php

namespace Database\Factories;

use App\Enums\MovementType;
use App\Models\InventoryMovement;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InventoryMovement>
 */
class InventoryMovementFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'store_id' => fn (array $attributes): int => Product::findOrFail($attributes['product_id'])->store_id,
            'product_id' => Product::factory(),
            'type' => MovementType::Restock,
            'quantity' => 5,
            'unit_cost' => null,
            'sale_id' => null,
            'user_id' => null,
            'note' => null,
        ];
    }
}
