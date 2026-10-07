<?php

namespace App\Actions;

use App\Enums\MovementType;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Single write point for stock: every change to a product's stock goes through the movements ledger.
 */
class RecordMovement
{
    /**
     * Record a signed stock delta and apply it atomically to the product's cached stock.
     */
    public function handle(
        Product $product,
        MovementType $type,
        int $delta,
        ?User $user = null,
        ?string $note = null,
        ?int $unitCost = null,
        ?Sale $sale = null,
    ): InventoryMovement {
        $this->guardSign($type, $delta);

        return DB::transaction(function () use ($product, $type, $delta, $user, $note, $unitCost, $sale): InventoryMovement {
            Product::withTrashed()->whereKey($product->getKey())->increment('stock', $delta);
            $product->refresh();

            return InventoryMovement::create([
                'store_id' => $product->store_id,
                'product_id' => $product->getKey(),
                'type' => $type,
                'quantity' => $delta,
                'unit_cost' => $unitCost,
                'sale_id' => $sale?->getKey(),
                'user_id' => $user?->getKey(),
                'note' => $note,
            ]);
        });
    }

    /**
     * Record a physical count: stores the difference between what was counted and what the system believed.
     * Returns null when the count matches the recorded stock.
     */
    public function count(Product $product, int $counted, ?User $user = null, ?string $note = null): ?InventoryMovement
    {
        return DB::transaction(function () use ($product, $counted, $user, $note): ?InventoryMovement {
            $product->refresh();
            $difference = $counted - $product->stock;

            if ($difference === 0) {
                return null;
            }

            return $this->handle($product, MovementType::Count, $difference, $user, $note);
        });
    }

    private function guardSign(MovementType $type, int $delta): void
    {
        if ($delta === 0) {
            throw new InvalidArgumentException('A stock movement cannot have a zero quantity.');
        }

        $expected = $type->expectedSign();

        if ($expected !== 0 && (($delta > 0) !== ($expected > 0))) {
            throw new InvalidArgumentException("A {$type->value} movement must be ".($expected > 0 ? 'positive' : 'negative').'.');
        }
    }
}
