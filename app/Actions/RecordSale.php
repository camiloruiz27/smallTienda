<?php

namespace App\Actions;

use App\Enums\MovementType;
use App\Enums\PaymentMethod;
use App\Enums\SaleStatus;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Store;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RecordSale
{
    public function __construct(private RecordMovement $recordMovement) {}

    /**
     * Register a self-service purchase. Idempotent per `submission_id`: repeating the same submission
     * returns the sale that was already created instead of discounting stock twice.
     *
     * Stock is allowed to go negative on purpose: the customer already holds the product, so the
     * mismatch is surfaced to the owner as a count discrepancy rather than blocking the purchase.
     *
     * @param  list<array{product_id: int, quantity: int}>  $items
     */
    public function handle(
        Store $store,
        array $items,
        PaymentMethod $paymentMethod,
        string $submissionId,
        ?string $customerName = null,
        ?string $customerPhone = null,
    ): Sale {
        $existing = $store->sales()->where('submission_id', $submissionId)->first();

        if ($existing !== null) {
            return $existing;
        }

        $quantities = $this->mergeQuantities($items);

        try {
            return DB::transaction(function () use ($store, $quantities, $paymentMethod, $submissionId, $customerName, $customerPhone): Sale {
                $products = $store->products()->active()->whereKey(array_keys($quantities))->get()->keyBy('id');

                if ($products->count() !== count($quantities)) {
                    throw ValidationException::withMessages([
                        'items' => 'Algún producto ya no está disponible. Actualiza la página e inténtalo de nuevo.',
                    ]);
                }

                $sale = $store->sales()->create([
                    'submission_id' => $submissionId,
                    'code' => $this->generateCode($store),
                    'customer_name' => $customerName,
                    'customer_phone' => $customerPhone,
                    'payment_method' => $paymentMethod,
                    'status' => SaleStatus::Pending,
                    'total' => 0,
                ]);

                $total = 0;

                foreach ($quantities as $productId => $quantity) {
                    /** @var Product $product */
                    $product = $products[$productId];
                    $subtotal = $product->price * $quantity;
                    $total += $subtotal;

                    $sale->items()->create([
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'unit_price' => $product->price,
                        'quantity' => $quantity,
                        'subtotal' => $subtotal,
                    ]);

                    $this->recordMovement->handle($product, MovementType::Sale, -$quantity, sale: $sale);
                }

                $sale->update(['total' => $total]);

                return $sale->load('items');
            });
        } catch (UniqueConstraintViolationException $exception) {
            $duplicate = $store->sales()->where('submission_id', $submissionId)->first();

            if ($duplicate === null) {
                throw $exception;
            }

            return $duplicate;
        }
    }

    /**
     * Collapse repeated product lines into a single quantity per product.
     *
     * @param  list<array{product_id: int, quantity: int}>  $items
     * @return array<int, int>
     */
    private function mergeQuantities(array $items): array
    {
        $quantities = [];

        foreach ($items as $item) {
            $productId = (int) Arr::get($item, 'product_id');
            $quantities[$productId] = ($quantities[$productId] ?? 0) + (int) Arr::get($item, 'quantity');
        }

        return $quantities;
    }

    private function generateCode(Store $store): string
    {
        do {
            $code = '';

            foreach (range(1, 8) as $ignored) {
                $code .= Sale::CODE_ALPHABET[random_int(0, strlen(Sale::CODE_ALPHABET) - 1)];
            }
        } while ($store->sales()->where('code', $code)->exists());

        return Str::upper($code);
    }
}
