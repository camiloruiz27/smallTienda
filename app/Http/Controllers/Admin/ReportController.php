<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PaymentMethod;
use App\Enums\SaleStatus;
use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Store $store): Response
    {
        $since = now()->subDays(29)->startOfDay();

        $sales = $store->sales()
            ->where('status', '!=', SaleStatus::Voided)
            ->where('created_at', '>=', $since)
            ->get(['id', 'total', 'payment_method', 'created_at']);

        $daily = collect(range(13, 0))->map(function (int $daysAgo) use ($sales): array {
            $day = now()->subDays($daysAgo)->startOfDay();
            $daySales = $sales->filter(fn ($sale) => $sale->created_at->isSameDay($day));

            return [
                'date' => $day->toDateString(),
                'total' => (int) $daySales->sum('total'),
                'count' => $daySales->count(),
            ];
        })->values();

        $byPaymentMethod = $sales->groupBy(fn ($sale) => $sale->payment_method->value)
            ->map(fn ($group, $method): array => [
                'method' => PaymentMethod::from($method)->label(),
                'total' => (int) $group->sum('total'),
                'count' => $group->count(),
            ])
            ->values();

        $topProducts = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.store_id', $store->id)
            ->where('sales.status', '!=', SaleStatus::Voided->value)
            ->where('sales.created_at', '>=', $since)
            ->groupBy('sale_items.product_name')
            ->selectRaw('sale_items.product_name as name, SUM(sale_items.quantity) as quantity, SUM(sale_items.subtotal) as revenue')
            ->orderByDesc('quantity')
            ->limit(8)
            ->get()
            ->map(fn ($row): array => [
                'name' => $row->name,
                'quantity' => (int) $row->quantity,
                'revenue' => (int) $row->revenue,
            ]);

        $inStock = $store->products()->where('stock', '>', 0);

        return Inertia::render('store/reports', [
            'daily' => $daily,
            'byPaymentMethod' => $byPaymentMethod,
            'topProducts' => $topProducts,
            'totals' => [
                'last_30_days' => (int) $sales->sum('total'),
                'sales_count' => $sales->count(),
                'inventory_cost_value' => (int) (clone $inStock)->selectRaw('COALESCE(SUM(stock * cost), 0) as value')->value('value'),
                'inventory_sale_value' => (int) (clone $inStock)->selectRaw('COALESCE(SUM(stock * price), 0) as value')->value('value'),
            ],
        ]);
    }

    /**
     * CSV download (UTF-8 with BOM so Excel opens accents correctly).
     */
    public function export(Store $store, string $type): StreamedResponse
    {
        abort_unless(in_array($type, ['inventory', 'sales'], true), 404);

        $filename = "{$store->slug}-{$type}-".now()->format('Ymd').'.csv';

        return response()->streamDownload(function () use ($store, $type): void {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");

            if ($type === 'inventory') {
                fputcsv($out, ['Producto', 'Código de barras', 'Categoría', 'Precio', 'Costo', 'Stock', 'Stock mínimo']);

                $store->products()->with('category:id,name')->orderBy('name')->each(function ($product) use ($out): void {
                    fputcsv($out, [
                        $product->name,
                        $product->barcode,
                        $product->category?->name,
                        $product->price,
                        $product->cost,
                        $product->stock,
                        $product->min_stock,
                    ]);
                });
            } else {
                fputcsv($out, ['Código', 'Fecha', 'Cliente', 'Método de pago', 'Estado', 'Total']);

                $store->sales()->latest()->each(function ($sale) use ($out): void {
                    fputcsv($out, [
                        $sale->code,
                        $sale->created_at->format('Y-m-d H:i'),
                        $sale->customer_name,
                        $sale->payment_method->label(),
                        $sale->status->label(),
                        $sale->total,
                    ]);
                });
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
