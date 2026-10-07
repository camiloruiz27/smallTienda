import { Button } from '@/components/ui/button';
import StoreLayout from '@/layouts/store-layout';
import { formatCOP, formatShortDate } from '@/lib/format';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Download } from 'lucide-react';

interface ReportsProps {
    daily: { date: string; total: number; count: number }[];
    byPaymentMethod: { method: string; total: number; count: number }[];
    topProducts: { name: string; quantity: number; revenue: number }[];
    totals: { last_30_days: number; sales_count: number; inventory_cost_value: number; inventory_sale_value: number };
}

export default function Reports({ daily, byPaymentMethod, topProducts, totals }: ReportsProps) {
    const store = usePage<SharedData>().props.currentStore!;
    const maxDaily = Math.max(1, ...daily.map((day) => day.total));
    const maxTop = Math.max(1, ...topProducts.map((product) => product.quantity));

    return (
        <StoreLayout title="Reportes" back={route('store.dashboard', store.id)} hideNav>
            <div className="grid gap-6 p-4 pb-10">
                <section className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border p-4">
                        <p className="text-muted-foreground text-xs">Ventas últimos 30 días</p>
                        <p className="mt-1 text-xl font-bold tabular-nums">{formatCOP(totals.last_30_days)}</p>
                        <p className="text-muted-foreground text-xs">{totals.sales_count} compras</p>
                    </div>
                    <div className="rounded-2xl border p-4">
                        <p className="text-muted-foreground text-xs">Valor del inventario</p>
                        <p className="mt-1 text-xl font-bold tabular-nums">{formatCOP(totals.inventory_sale_value)}</p>
                        <p className="text-muted-foreground text-xs">A costo: {formatCOP(totals.inventory_cost_value)}</p>
                    </div>
                </section>

                <section aria-labelledby="daily-title">
                    <h2 id="daily-title" className="mb-3 font-semibold">
                        Ventas por día (14 días)
                    </h2>
                    <ul className="grid gap-2">
                        {[...daily].reverse().map((day) => (
                            <li key={day.date} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-sm">
                                <span className="text-muted-foreground capitalize">{formatShortDate(day.date)}</span>
                                <span className="bg-muted h-3 overflow-hidden rounded-full" role="presentation">
                                    <span className="bg-primary block h-full rounded-full" style={{ width: `${(day.total / maxDaily) * 100}%` }} />
                                </span>
                                <span className="w-24 text-right tabular-nums">{formatCOP(day.total)}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section aria-labelledby="top-title">
                    <h2 id="top-title" className="mb-3 font-semibold">
                        Lo más vendido (30 días)
                    </h2>
                    {topProducts.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Aún no hay ventas en este periodo.</p>
                    ) : (
                        <ol className="grid gap-3">
                            {topProducts.map((product, index) => (
                                <li key={product.name}>
                                    <div className="flex justify-between gap-3 text-sm">
                                        <span className="truncate font-medium">
                                            {index + 1}. {product.name}
                                        </span>
                                        <span className="text-muted-foreground shrink-0 tabular-nums">
                                            {product.quantity} uds · {formatCOP(product.revenue)}
                                        </span>
                                    </div>
                                    <div className="bg-muted mt-1 h-2 overflow-hidden rounded-full">
                                        <div className="bg-primary h-full rounded-full" style={{ width: `${(product.quantity / maxTop) * 100}%` }} />
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>

                {byPaymentMethod.length > 0 && (
                    <section aria-labelledby="methods-title">
                        <h2 id="methods-title" className="mb-3 font-semibold">
                            Por método de pago (30 días)
                        </h2>
                        <ul className="divide-y overflow-hidden rounded-2xl border">
                            {byPaymentMethod.map((method) => (
                                <li key={method.method} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                                    <span className="font-medium">{method.method}</span>
                                    <span className="tabular-nums">
                                        {formatCOP(method.total)} <span className="text-muted-foreground">({method.count})</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section aria-labelledby="export-title" className="grid gap-2">
                    <h2 id="export-title" className="font-semibold">
                        Exportar a Excel (CSV)
                    </h2>
                    <Button asChild variant="outline" size="lg">
                        <a href={route('store.reports.export', [store.id, 'inventory'])}>
                            <Download /> Inventario actual
                        </a>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <a href={route('store.reports.export', [store.id, 'sales'])}>
                            <Download /> Todas las ventas
                        </a>
                    </Button>
                </section>
            </div>
        </StoreLayout>
    );
}
