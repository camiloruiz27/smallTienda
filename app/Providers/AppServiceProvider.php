<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Public self-service checkout: limited per IP and store so a single device cannot flood the inventory.
        // Throttling runs before route-model binding, so `store` is still the raw public token here.
        RateLimiter::for('checkout', fn (Request $request): Limit => Limit::perMinute(10)->by($request->ip().'|'.$request->route('store')));
    }
}
