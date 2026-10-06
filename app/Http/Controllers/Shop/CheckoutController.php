<?php

namespace App\Http\Controllers\Shop;

use App\Actions\RecordSale;
use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\CheckoutRequest;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;

class CheckoutController extends Controller
{
    public function store(CheckoutRequest $request, Store $store, RecordSale $recordSale): RedirectResponse
    {
        $sale = $recordSale->handle(
            $store,
            $request->validated('items'),
            PaymentMethod::from($request->validated('payment_method')),
            $request->validated('submission_id'),
            $request->validated('customer_name'),
            $request->validated('customer_phone'),
        );

        return to_route('shop.receipt', [$store->public_token, $sale->code]);
    }
}
