<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function (Request $request) {
    if ($request->user()) {
        return to_route('dashboard');
    }

    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function (Request $request) {
        $stores = $request->user()->stores()->get(['stores.id']);

        return match ($stores->count()) {
            0 => to_route('stores.create'),
            1 => to_route('store.dashboard', $stores->first()),
            default => to_route('stores.index'),
        };
    })->name('dashboard');
});

require __DIR__.'/store.php';
require __DIR__.'/shop.php';
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
