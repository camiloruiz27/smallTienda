import EmptyState from '@/components/empty-state';
import ProductThumb from '@/components/product-thumb';
import StockBadge from '@/components/stock-badge';
import { Button } from '@/components/ui/button';
import StoreLayout from '@/layouts/store-layout';
import { formatCOP, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { AlertTriangle, ChevronRight, ClipboardCheck, PackagePlus, PackageSearch, Receipt, ScanBarcode } from 'lucide-react';

interface Stats {
    today_total: number;
    today_count: number;
    pending_count: number;
    pending_total: number;
    low_stock_count: number;
    negative_stock_count: number;
    product_count: number;
}

interface PendingSale {
    id: number;
    code: string;
    customer_name: string | null;
    payment_method: string;
    total: number;
    items_count: number;
    created_at: string;
}

interface AttentionProduct {
    id: number;
    name: string;
    stock: number;
    min_stock: number;
    image_url: string | null;
}

interface DashboardProps {
    stats: Stats;
    pendingSales: PendingSale[];
    attention: AttentionProduct[];
}

export default function Dashboard({ stats, pendingSales, attention }: DashboardProps) {
    const store = usePage<SharedData>().props.currentStore!;

    if (stats.product_count === 0) {
        return (
            <StoreLayout title="Inicio">
                <EmptyState
                    icon={PackageSearch}
                    title="Tu tienda está lista"
                    description="Agrega tu primer producto para que tus clientes puedan registrar lo que toman."
                >
                    <Button asChild size="lg" className="mt-2">
                        <Link href={route('store.products.create', store.id)}>Agregar producto</Link>
                    </Button>
                </EmptyState>
            </StoreLayout>
        );
    }

    return (
        <StoreLayout title="Inicio">
            <div className="grid gap-5 p-4">
                <section aria-label="Resumen de hoy" className="bg-primary text-primary-foreground rounded-3xl p-5">
                    <p className="text-sm opacity-80">Vendido hoy</p>
                    <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">{formatCOP(stats.today_total)}</p>
                    <p className="mt-1 text-sm opacity-80">
                        {stats.today_count} {stats.today_count === 1 ? 'compra' : 'compras'} registradas
                    </p>
                </section>

                <section className="grid grid-cols-2 gap-3">
                    <Link
                        href={route('store.sales.index', store.id)}
                        className={cn('rounded-2xl border p-4', stats.pending_count > 0 && 'border-warning/50 bg-warning/10')}
                    >
                        <Receipt className="text-warning mb-2 size-6" />
                        <p className="text-2xl font-bold tabular-nums">{stats.pending_count}</p>
                        <p className="text-muted-foreground text-sm">Por confirmar</p>
                        {stats.pending_count > 0 && <p className="mt-0.5 text-xs font-medium tabular-nums">{formatCOP(stats.pending_total)}</p>}
                    </Link>
                    <Link
                        href={route('store.inventory.index', { store: store.id, filter: stats.negative_stock_count > 0 ? 'negative' : 'low' })}
                        className={cn('rounded-2xl border p-4', stats.negative_stock_count > 0 && 'border-destructive/40 bg-destructive/10')}
                    >
                        <AlertTriangle className="text-destructive mb-2 size-6" />
                        <p className="text-2xl font-bold tabular-nums">{stats.low_stock_count + stats.negative_stock_count}</p>
                        <p className="text-muted-foreground text-sm">Stock por revisar</p>
                        {stats.negative_stock_count > 0 && (
                            <p className="text-destructive mt-0.5 text-xs font-medium">{stats.negative_stock_count} con conteo negativo</p>
                        )}
                    </Link>
                </section>

                <section className="grid grid-cols-2 gap-3">
                    <Button asChild variant="secondary" size="lg" className="h-14 flex-col gap-0.5 text-sm">
                        <Link href={route('store.inventory.restock', store.id)}>
                            <PackagePlus className="size-5" /> Reponer
                        </Link>
                    </Button>
                    <Button asChild variant="secondary" size="lg" className="h-14 flex-col gap-0.5 text-sm">
                        <Link href={route('store.inventory.count', store.id)}>
                            <ClipboardCheck className="size-5" /> Contar inventario
                        </Link>
                    </Button>
                </section>

                {pendingSales.length > 0 && (
                    <section aria-labelledby="pending-title">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 id="pending-title" className="font-semibold">
                                Compras por confirmar
                            </h2>
                            <Link href={route('store.sales.index', store.id)} className="text-primary text-sm font-medium">
                                Ver todas
                            </Link>
                        </div>
                        <ul className="divide-y overflow-hidden rounded-2xl border">
                            {pendingSales.map((sale) => (
                                <li key={sale.id}>
                                    <Link
                                        href={route('store.sales.index', store.id)}
                                        className="hover:bg-accent flex min-h-16 items-center gap-3 px-4 py-3"
                                    >
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-medium">{sale.customer_name || 'Cliente sin nombre'}</span>
                                            <span className="text-muted-foreground block text-xs">
                                                {sale.items_count} {sale.items_count === 1 ? 'producto' : 'productos'} · {sale.payment_method} ·{' '}
                                                {formatRelative(sale.created_at)}
                                            </span>
                                        </span>
                                        <span className="font-semibold tabular-nums">{formatCOP(sale.total)}</span>
                                        <ChevronRight className="text-muted-foreground size-4" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {attention.length > 0 && (
                    <section aria-labelledby="attention-title">
                        <h2 id="attention-title" className="mb-2 font-semibold">
                            Productos que necesitan atención
                        </h2>
                        <ul className="divide-y overflow-hidden rounded-2xl border">
                            {attention.map((product) => (
                                <li key={product.id} className="flex min-h-16 items-center gap-3 px-4 py-3">
                                    <ProductThumb src={product.image_url} name={product.name} className="size-10" />
                                    <span className="min-w-0 flex-1 truncate font-medium">{product.name}</span>
                                    <StockBadge stock={product.stock} minStock={product.min_stock} />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <Button asChild variant="outline" size="lg">
                    <a href={route('shop.show', store.public_token)} target="_blank" rel="noreferrer">
                        <ScanBarcode /> Ver cómo lo ve el cliente
                    </a>
                </Button>
            </div>
        </StoreLayout>
    );
}
