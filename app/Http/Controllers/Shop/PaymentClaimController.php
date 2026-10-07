<?php

namespace App\Http\Controllers\Shop;

use App\Enums\SaleStatus;
use App\Events\PaymentClaimed;
use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;

class PaymentClaimController extends Controller
{
    /**
     * The customer says they already paid. This never confirms the sale: it only tells the owner
     * which pending sales to verify first. Repeating it keeps the original moment.
     */
    public function __invoke(Store $store, Sale $sale): RedirectResponse
    {
        if ($sale->status === SaleStatus::Pending && $sale->paid_claimed_at === null) {
            $sale->update(['paid_claimed_at' => now()]);

            PaymentClaimed::dispatch($sale);
        }

        return to_route('shop.receipt', [$store->public_token, $sale->code]);
    }
}
