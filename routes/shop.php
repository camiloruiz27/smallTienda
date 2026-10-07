<?php

use App\Http\Controllers\Shop\CheckoutController;
use App\Http\Controllers\Shop\PaymentClaimController;
use App\Http\Controllers\Shop\ShopController;
use Illuminate\Support\Facades\Route;

Route::prefix('t/{store:public_token}')
    ->scopeBindings()
    ->name('shop.')
    ->group(function () {
        Route::get('/', [ShopController::class, 'show'])->name('show');
        Route::post('checkout', [CheckoutController::class, 'store'])->middleware('throttle:checkout')->name('checkout');
        Route::get('compra/{sale:code}', [ShopController::class, 'receipt'])->name('receipt');
        Route::post('compra/{sale:code}/pagado', PaymentClaimController::class)->middleware('throttle:30,1')->name('paid');
    });
