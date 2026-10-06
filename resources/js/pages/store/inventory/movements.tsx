import EmptyState from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import StoreLayout from '@/layouts/store-layout';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type Paginated, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { History } from 'lucide-react';

interface Movement {
    id: number;
    type: string;
    type_label: string;
    quantity: number;
    note: string | null;
    product_name: string | null;
    user_name: string | null;
    created_at: string;
}

interface MovementsProps {
    movements: Paginated<Movement>;
    product: { id: number; name: string } | null;
}

export default function Movements({ movements, product }: MovementsProps) {
    const store = usePage<SharedData>().props.currentStore!;

    return (
        <StoreLayout title={product ? `Historial · ${product.name}` : 'Movimientos'} back={route('store.inventory.index', store.id)} hideNav>
            {movements.data.length === 0 ? (
                <EmptyState icon={History} title="Sin movimientos" description="Aquí verás cada venta, reposición y ajuste del inventario." />
            ) : (
                <>
                    <ul className="divide-y border-b">
                        {movements.data.map((movement) => (
                            <li key={movement.id} className="flex min-h-16 items-center gap-3 px-4 py-2.5">
                                <span
                                    className={cn(
                                        'flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums',
                                        movement.quantity > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
                                    )}
                                >
                                    {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium">{movement.product_name ?? 'Producto eliminado'}</span>
                                    <span className="text-muted-foreground block truncate text-xs">
                                        {movement.type_label}
                                        {movement.user_name && ` · ${movement.user_name}`}
                                        {movement.note && ` · ${movement.note}`}
                                    </span>
                                </span>
                                <span className="text-muted-foreground shrink-0 text-xs">{formatDateTime(movement.created_at)}</span>
                            </li>
                        ))}
                    </ul>

                    {(movements.prev_page_url || movements.next_page_url) && (
                        <div className="flex items-center justify-between gap-3 p-4">
                            {movements.prev_page_url ? (
                                <Button asChild variant="outline">
                                    <Link href={movements.prev_page_url} preserveScroll only={['movements']}>
                                        Anteriores
                                    </Link>
                                </Button>
                            ) : (
                                <span />
                            )}
                            <span className="text-muted-foreground text-sm">
                                {movements.current_page} / {movements.last_page}
                            </span>
                            {movements.next_page_url ? (
                                <Button asChild variant="outline">
                                    <Link href={movements.next_page_url} preserveScroll only={['movements']}>
                                        Siguientes
                                    </Link>
                                </Button>
                            ) : (
                                <span />
                            )}
                        </div>
                    )}
                </>
            )}
        </StoreLayout>
    );
}
