<?php

namespace App\Http\Controllers\Admin;

use App\Actions\VoidSale;
use App\Enums\SaleStatus;
use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function index(Request $request, Store $store): Response
    {
        $status = SaleStatus::tryFrom((string) $request->query('status')) ?? SaleStatus::Pending;

        $sales = $store->sales()
            ->where('status', $status)
            ->with('items:id,sale_id,product_name,quantity,subtotal')
            // Sales whose customer already said they paid go first so the owner verifies those in the bank app first.
            ->orderByRaw('CASE WHEN paid_claimed_at IS NULL THEN 1 ELSE 0 END')
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Sale $sale): array => [
                'id' => $sale->id,
                'code' => $sale->code,
                'customer_name' => $sale->customer_name,
                'customer_phone' => $sale->customer_phone,
                'payment_method' => $sale->payment_method->label(),
                'status' => $sale->status->value,
                'total' => $sale->total,
                'paid_claimed' => $sale->paid_claimed_at !== null,
                'created_at' => $sale->created_at->toIso8601String(),
                'items' => $sale->items->map->only(['id', 'product_name', 'quantity', 'subtotal'])->values(),
            ]);

        return Inertia::render('store/sales/index', [
            'sales' => $sales,
            'status' => $status->value,
            'counts' => [
                'pending' => $store->sales()->where('status', SaleStatus::Pending)->count(),
            ],
        ]);
    }

    public function confirm(Request $request, Store $store, Sale $sale): RedirectResponse
    {
        if ($sale->status === SaleStatus::Pending) {
            $sale->update([
                'status' => SaleStatus::Confirmed,
                'confirmed_by' => $request->user()->id,
                'confirmed_at' => now(),
            ]);
        }

        return back()->with('success', "Venta {$sale->code} confirmada.");
    }

    public function void(Request $request, Store $store, Sale $sale, VoidSale $voidSale): RedirectResponse
    {
        $voidSale->handle($sale, $request->user());

        return back()->with('success', "Venta {$sale->code} anulada y stock repuesto.");
    }
}
