import { Button } from '@/components/ui/button';
import ShopLayout from '@/layouts/shop-layout';
import { copyText } from '@/lib/clipboard';
import { formatCOP, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { BadgeCheck, Banknote, Check, CheckCircle2, ChevronDown, Copy, Download, LoaderCircle, Smartphone } from 'lucide-react';
import { useState } from 'react';

interface ReceiptProps {
    store: {
        name: string;
        token: string;
        payment_key: string | null;
        payment_qr_url: string | null;
        payment_instructions: string | null;
    };
    sale: {
        code: string;
        status: 'pending' | 'confirmed' | 'voided';
        status_label: string;
        payment_method: 'cash' | 'breb';
        payment_method_label: string;
        total: number;
        customer_name: string | null;
        paid_claimed: boolean;
        created_at: string;
        items: { id: number; product_name: string; unit_price: number; quantity: number; subtotal: number }[];
    };
}

export default function Receipt({ store, sale }: ReceiptProps) {
    const [copied, setCopied] = useState<'key' | 'total' | null>(null);
    const [claiming, setClaiming] = useState(false);
    const isVoided = sale.status === 'voided';
    const needsPayment = sale.status === 'pending';
    const unitCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);

    const markPaid = () => {
        setClaiming(true);
        router.post(route('shop.paid', [store.token, sale.code]), {}, { preserveScroll: true, onFinish: () => setClaiming(false) });
    };

    const copy = async (what: 'key' | 'total', text: string) => {
        if (await copyText(text)) {
            setCopied(what);
            window.setTimeout(() => setCopied(null), 2000);
        }
    };

    return (
        <ShopLayout storeName={store.name} storeToken={store.token} title="Compra registrada">
            <div className="grid gap-4 p-4 pb-10">
                <div className="flex items-center gap-3 pt-2">
                    <span
                        className={cn(
                            'flex size-12 shrink-0 items-center justify-center rounded-full',
                            isVoided ? 'bg-muted text-muted-foreground' : 'bg-success/10 text-success',
                        )}
                    >
                        <CheckCircle2 className="size-7" aria-hidden />
                    </span>
                    <div className="min-w-0">
                        <h1 className="text-xl leading-tight font-bold">{isVoided ? 'Compra anulada' : '¡Compra registrada!'}</h1>
                        <p className="text-muted-foreground text-xs">
                            {sale.customer_name ? `${sale.customer_name} · ` : ''}Código{' '}
                            <span className="text-foreground font-mono font-semibold tracking-wider">{sale.code}</span>
                        </p>
                    </div>
                </div>

                {needsPayment && sale.payment_method === 'breb' && (
                    <section className="bg-card grid gap-4 rounded-2xl border p-4" aria-labelledby="pay-title">
                        <div className="flex items-end justify-between gap-3">
                            <div>
                                <h2 id="pay-title" className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium">
                                    <Smartphone className="size-4" /> Paga con Bre-B
                                </h2>
                                <p className="text-3xl font-bold tracking-tight tabular-nums">{formatCOP(sale.total)}</p>
                            </div>
                            <Button type="button" variant="secondary" size="sm" onClick={() => copy('total', String(sale.total))}>
                                {copied === 'total' ? <Check /> : <Copy />} {copied === 'total' ? 'Copiado' : 'Copiar valor'}
                            </Button>
                        </div>

                        {store.payment_key && (
                            <div className="bg-muted flex items-center gap-3 rounded-xl p-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-muted-foreground text-xs">Llave</p>
                                    <p className="truncate text-lg font-semibold select-all">{store.payment_key}</p>
                                </div>
                                <Button type="button" size="sm" onClick={() => copy('key', store.payment_key ?? '')}>
                                    {copied === 'key' ? <Check /> : <Copy />} {copied === 'key' ? 'Copiada' : 'Copiar'}
                                </Button>
                            </div>
                        )}

                        {store.payment_qr_url && (
                            <div className="grid justify-items-center gap-2">
                                <img
                                    src={store.payment_qr_url}
                                    alt={`QR Bre-B de ${store.name}`}
                                    className="size-48 rounded-xl bg-white object-contain p-2"
                                />
                                <a
                                    href={store.payment_qr_url}
                                    download="qr-bre-b.png"
                                    className="text-primary inline-flex h-10 items-center gap-1.5 text-sm font-medium"
                                >
                                    <Download className="size-4" /> Guardar QR
                                </a>
                            </div>
                        )}

                        <p className="text-muted-foreground text-xs">
                            Abre la app de tu banco y paga con la llave
                            {store.payment_qr_url ? ' o escanea el QR (puedes subirlo desde tu galería)' : ''}.
                        </p>
                    </section>
                )}

                {needsPayment && sale.payment_method === 'cash' && (
                    <section className="border-warning/40 bg-warning/10 grid gap-1 rounded-2xl border p-4" aria-labelledby="pay-title">
                        <h2 id="pay-title" className="flex items-center gap-2 font-semibold">
                            <Banknote className="size-5" /> Paga en efectivo: {formatCOP(sale.total)}
                        </h2>
                        <p className="text-sm whitespace-pre-line">{store.payment_instructions || 'Deja el efectivo en la tienda.'}</p>
                    </section>
                )}

                {needsPayment &&
                    (sale.paid_claimed ? (
                        <p className="bg-success/10 text-success flex items-center gap-2 rounded-2xl p-4 text-sm font-medium" role="status">
                            <BadgeCheck className="size-5 shrink-0" aria-hidden />
                            Listo, avisamos al encargado. Él confirmará tu pago.
                        </p>
                    ) : (
                        <Button type="button" size="lg" className="h-14 text-base" onClick={markPaid} disabled={claiming}>
                            {claiming ? <LoaderCircle className="animate-spin" /> : <BadgeCheck />} Ya pagué
                        </Button>
                    ))}

                {!needsPayment && (
                    <div className="bg-card rounded-2xl border p-4 text-center">
                        <p className="text-muted-foreground text-sm">Total</p>
                        <p className="text-3xl font-bold tracking-tight tabular-nums">{formatCOP(sale.total)}</p>
                    </div>
                )}

                <details className="group bg-card rounded-2xl border">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4">
                        <span className="font-medium">
                            Detalle · {unitCount} {unitCount === 1 ? 'producto' : 'productos'}
                        </span>
                        <ChevronDown className="text-muted-foreground size-5 transition-transform group-open:rotate-180" />
                    </summary>
                    <ul className="divide-y border-t">
                        {sale.items.map((item) => (
                            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                                <span className="min-w-0 truncate">
                                    {item.quantity} × {item.product_name}
                                </span>
                                <span className="font-semibold tabular-nums">{formatCOP(item.subtotal)}</span>
                            </li>
                        ))}
                        <li className="text-muted-foreground px-4 py-2.5 text-xs">
                            {sale.status_label} · {formatDateTime(sale.created_at)}
                        </li>
                    </ul>
                </details>

                <Button asChild size="lg" variant="outline">
                    <Link href={route('shop.show', store.token)}>Hacer otra compra</Link>
                </Button>
            </div>
        </ShopLayout>
    );
}
