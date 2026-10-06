<?php

namespace App\Actions;

use App\Enums\MovementType;
use App\Enums\SaleStatus;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class VoidSale
{
    public function __construct(private RecordMovement $recordMovement) {}

    /**
     * Void a sale and put its items back into stock. Voiding an already voided sale does nothing.
     */
    public function handle(Sale $sale, User $user): Sale
    {
        return DB::transaction(function () use ($sale, $user): Sale {
            $sale = Sale::query()->whereKey($sale->getKey())->firstOrFail();

            if ($sale->status === SaleStatus::Voided) {
                return $sale;
            }

            foreach ($sale->items()->with('product')->get() as $item) {
                if ($item->product === null) {
                    continue;
                }

                $this->recordMovement->handle(
                    $item->product,
                    MovementType::Void,
                    $item->quantity,
                    $user,
                    "Anulación venta {$sale->code}",
                    sale: $sale,
                );
            }

            $sale->update(['status' => SaleStatus::Voided]);

            return $sale;
        });
    }
}
