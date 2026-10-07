import BottomSheet from '@/components/bottom-sheet';
import EmptyState from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import StoreLayout from '@/layouts/store-layout';
import { formatCOP, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type Paginated, type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { BadgeCheck, Check, ChevronDown, LoaderCircle, Phone, Receipt, Undo2 } from 'lucide-react';
import { useState } from 'react';

interface SaleItem {
    id: number;
    product_name: string;
    quantity: number;
    subtotal: number;
}

interface Sale {
    id: number;
    code: string;
    customer_name: string | null;
    customer_phone: string | null;
    payment_method: string;
    status: 'pending' | 'confirmed' | 'voided';
    total: number;
    paid_claimed: boolean;
    created_at: string;
    items: SaleItem[];
}

interface SalesIndexProps {
    sales: Paginated<Sale>;
    status: Sale['status'];
    counts: { pending: number };
}

const tabs: { value: Sale['status']; label: string }[] = [
    { value: 'pending', label: 'Por confirmar' },
    { value: 'confirmed', label: 'Confirmadas' },
    { value: 'voided', label: 'Anuladas' },
];

export default function SalesIndex({ sales, status, counts }: SalesIndexProps) {
    const store = usePage<SharedData>().props.currentStore!;
    const [expanded, setExpanded] = useState<number | null>(null);
    const [voiding, setVoiding] = useState<Sale | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);

    const confirmSale = (sale: Sale) => {
        setBusyId(sale.id);
        router.post(route('store.sales.confirm', [store.id, sale.id]), {}, { preserveScroll: true, onFinish: () => setBusyId(null) });
    };

    const voidSale = () => {
        if (!voiding) {
            return;
        }
        setBusyId(voiding.id);
        router.post(
            route('store.sales.void', [store.id, voiding.id]),
            {},
            { preserveScroll: true, onSuccess: () => setVoiding(null), onFinish: () => setBusyId(null) },
        );
    };

    return (
        <StoreLayout title="Ventas">
            <div className="flex gap-2 overflow-x-auto p-4 pb-2" role="tablist" aria-label="Estado de las ventas">
                {tabs.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={status === tab.value}
                        onClick={() =>
                            router.get(route('store.sales.index', { store: store.id, status: tab.value }), {}, { preserveState: true, replace: true })
                        }
                        className={cn(
                            'h-10 shrink-0 rounded-full border px-4 text-sm font-medium',
                            status === tab.value ? 'bg-primary text-primary-foreground border-transparent' : 'bg-background',
                        )}
                    >
                        {tab.label}
                        {tab.value === 'pending' && counts.pending > 0 ? ` (${counts.pending})` : ''}
                    </button>
                ))}
            </div>

            {sales.data.length === 0 ? (
                <EmptyState
                    icon={Receipt}
                    title={status === 'pending' ? 'Nada por confirmar' : 'Sin ventas aquí'}
                    description={
                        status === 'pending' ? 'Cuando un cliente registre una compra, aparecerá aquí para que confirmes el pago.' : undefined
                    }
                />
            ) : (
                <ul className="grid gap-3 p-4">
                    {sales.data.map((sale) => {
                        const isOpen = expanded === sale.id;
                        const busy = busyId === sale.id;

                        return (
                            <li key={sale.id} className="overflow-hidden rounded-2xl border">
                                <button
                                    type="button"
                                    onClick={() => setExpanded(isOpen ? null : sale.id)}
                                    className="flex min-h-[4.5rem] w-full items-center gap-3 p-4 text-left"
                                    aria-expanded={isOpen}
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-semibold">{sale.customer_name || 'Cliente sin nombre'}</span>
                                        {sale.status === 'pending' && sale.paid_claimed && (
                                            <span className="bg-success/10 text-success mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                                                <BadgeCheck className="size-3.5" aria-hidden /> Dice que ya pagó
                                            </span>
                                        )}
                                        <span className="text-muted-foreground block text-xs">
                                            {sale.payment_method} · {formatDateTime(sale.created_at)} · {sale.code}
                                        </span>
                                    </span>
                                    <span className="text-lg font-bold tabular-nums">{formatCOP(sale.total)}</span>
                                    <ChevronDown className={cn('text-muted-foreground size-5 transition-transform', isOpen && 'rotate-180')} />
                                </button>

                                {isOpen && (
                                    <div className="grid gap-3 border-t px-4 pt-3 pb-4">
                                        <ul className="grid gap-1 text-sm">
                                            {sale.items.map((item) => (
                                                <li key={item.id} className="flex justify-between gap-3">
                                                    <span className="truncate">
                                                        {item.quantity} × {item.product_name}
                                                    </span>
                                                    <span className="tabular-nums">{formatCOP(item.subtotal)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {sale.customer_phone && (
                                            <a
                                                href={`tel:${sale.customer_phone}`}
                                                className="text-primary inline-flex items-center gap-2 text-sm font-medium"
                                            >
                                                <Phone className="size-4" /> {sale.customer_phone}
                                            </a>
                                        )}
                                    </div>
                                )}

                                {sale.status !== 'voided' && (
                                    <div className={cn('grid gap-2 border-t p-3', sale.status === 'pending' ? 'grid-cols-[1fr_auto]' : '')}>
                                        {sale.status === 'pending' && (
                                            <Button onClick={() => confirmSale(sale)} disabled={busy} className="h-12">
                                                {busy ? <LoaderCircle className="animate-spin" /> : <Check />} Pago recibido
                                            </Button>
                                        )}
                                        <Button variant="outline" onClick={() => setVoiding(sale)} disabled={busy} className="h-12">
                                            <Undo2 /> Anular
                                        </Button>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {(sales.prev_page_url || sales.next_page_url) && (
                <div className="flex items-center justify-between gap-3 px-4 pb-4">
                    {sales.prev_page_url ? (
                        <Button asChild variant="outline">
                            <Link href={sales.prev_page_url} preserveScroll>
                                Anteriores
                            </Link>
                        </Button>
                    ) : (
                        <span />
                    )}
                    <span className="text-muted-foreground text-sm">
                        {sales.current_page} / {sales.last_page}
                    </span>
                    {sales.next_page_url ? (
                        <Button asChild variant="outline">
                            <Link href={sales.next_page_url} preserveScroll>
                                Siguientes
                            </Link>
                        </Button>
                    ) : (
                        <span />
                    )}
                </div>
            )}

            <BottomSheet
                open={voiding !== null}
                onOpenChange={(isOpen) => !isOpen && setVoiding(null)}
                title={`¿Anular la venta ${voiding?.code ?? ''}?`}
                description="Los productos vuelven al inventario. Úsalo si el cliente no se llevó lo registrado o hubo un error."
            >
                <div className="grid gap-2">
                    <Button variant="destructive" size="lg" onClick={voidSale} disabled={busyId !== null}>
                        {busyId !== null && <LoaderCircle className="animate-spin" />}
                        Sí, anular y reponer stock
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => setVoiding(null)}>
                        Cancelar
                    </Button>
                </div>
            </BottomSheet>
        </StoreLayout>
    );
}
