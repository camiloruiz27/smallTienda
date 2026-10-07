<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SaleStatus;
use App\Http\Controllers\Controller;
use App\Models\Store;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Store $store): Response
    {
        $today = now()->startOfDay();

        $todaySales = $store->sales()->where('created_at', '>=', $today)->where('status', '!=', SaleStatus::Voided);
        $pending = $store->sales()->where('status', SaleStatus::Pending);

        $attention = $store->products()
            ->active()
            ->where(fn ($query) => $query->negativeStock()->orWhere(fn ($low) => $low->lowStock()))
            ->orderBy('stock')
            ->limit(6)
            ->get(['id', 'name', 'stock', 'min_stock', 'image_path']);

        return Inertia::render('store/dashboard', [
            'stats' => [
                'today_total' => (int) (clone $todaySales)->sum('total'),
                'today_count' => (clone $todaySales)->count(),
                'pending_count' => (clone $pending)->count(),
                'pending_total' => (int) (clone $pending)->sum('total'),
                'low_stock_count' => $store->products()->active()->lowStock()->count(),
                'negative_stock_count' => $store->products()->active()->negativeStock()->count(),
                'product_count' => $store->products()->count(),
            ],
            'pendingSales' => $store->sales()
                ->where('status', SaleStatus::Pending)
                ->withCount('items')
                ->orderByRaw('CASE WHEN paid_claimed_at IS NULL THEN 1 ELSE 0 END')
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn ($sale): array => [
                    'id' => $sale->id,
                    'code' => $sale->code,
                    'customer_name' => $sale->customer_name,
                    'payment_method' => $sale->payment_method->label(),
                    'total' => $sale->total,
                    'items_count' => $sale->items_count,
                    'paid_claimed' => $sale->paid_claimed_at !== null,
                    'created_at' => $sale->created_at->toIso8601String(),
                ]),
            'attention' => $attention,
        ]);
    }
}
