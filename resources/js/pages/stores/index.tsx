import FlashMessage from '@/components/flash-message';
import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { ChevronRight, Plus, Store } from 'lucide-react';

interface StoreRow {
    id: number;
    name: string;
    role: 'owner' | 'manager';
    pending_sales_count: number;
}

export default function StoresIndex({ stores }: { stores: StoreRow[] }) {
    return (
        <div className="bg-background pt-safe pb-safe min-h-svh">
            <Head title="Tus tiendas" />
            <FlashMessage />

            <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-8">
                <h1 className="text-2xl font-semibold">Tus tiendas</h1>

                <ul className="grid gap-3">
                    {stores.map((store) => (
                        <li key={store.id}>
                            <Link
                                href={route('store.dashboard', store.id)}
                                className="hover:bg-accent flex min-h-16 items-center gap-3 rounded-2xl border p-4"
                            >
                                <span className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl">
                                    <Store className="size-5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-semibold">{store.name}</span>
                                    <span className="text-muted-foreground block text-xs">
                                        {store.role === 'owner' ? 'Dueño' : 'Encargado'}
                                        {store.pending_sales_count > 0 && ` · ${store.pending_sales_count} por confirmar`}
                                    </span>
                                </span>
                                <ChevronRight className="text-muted-foreground size-5" />
                            </Link>
                        </li>
                    ))}
                </ul>

                <Button asChild size="lg" variant="outline">
                    <Link href={route('stores.create')}>
                        <Plus /> Crear otra tienda
                    </Link>
                </Button>
            </div>
        </div>
    );
}
