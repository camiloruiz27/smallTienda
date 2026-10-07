import BottomSheet from '@/components/bottom-sheet';
import EmptyState from '@/components/empty-state';
import FormField from '@/components/form-field';
import ProductThumb from '@/components/product-thumb';
import QuantityStepper from '@/components/quantity-stepper';
import StockBadge from '@/components/stock-badge';
import { Button } from '@/components/ui/button';
import StoreLayout from '@/layouts/store-layout';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { ClipboardCheck, History, LoaderCircle, PackageCheck, PackagePlus } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface InventoryProduct {
    id: number;
    name: string;
    barcode: string | null;
    stock: number;
    min_stock: number;
    image_url: string | null;
}

interface InventoryIndexProps {
    products: InventoryProduct[];
    filter: 'all' | 'low' | 'negative';
    counts: { low: number; negative: number };
}

type AdjustMode = 'add' | 'remove' | 'waste';

const modes: { value: AdjustMode; label: string; hint: string }[] = [
    { value: 'add', label: 'Sumar', hint: 'Encontré más unidades' },
    { value: 'remove', label: 'Restar', hint: 'Corregir hacia abajo' },
    { value: 'waste', label: 'Merma', hint: 'Vencido, dañado o perdido' },
];

export default function InventoryIndex({ products, filter, counts }: InventoryIndexProps) {
    const store = usePage<SharedData>().props.currentStore!;
    const [adjusting, setAdjusting] = useState<InventoryProduct | null>(null);
    const [mode, setMode] = useState<AdjustMode>('add');
    const [quantity, setQuantity] = useState(1);
    const { data, setData, post, processing, errors, transform, reset } = useForm({ note: '' });

    const filters = [
        { value: 'all', label: 'Todo', count: null },
        { value: 'low', label: 'Stock bajo', count: counts.low },
        { value: 'negative', label: 'Por revisar', count: counts.negative },
    ] as const;

    const open = (product: InventoryProduct) => {
        reset();
        setMode('add');
        setQuantity(1);
        setAdjusting(product);
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        if (!adjusting) {
            return;
        }

        transform((values) => ({
            ...values,
            type: mode === 'waste' ? 'waste' : 'adjustment',
            direction: mode === 'remove' ? 'remove' : 'add',
            quantity,
        }));
        post(route('store.inventory.adjust', [store.id, adjusting.id]), {
            preserveScroll: true,
            onSuccess: () => setAdjusting(null),
        });
    };

    return (
        <StoreLayout title="Inventario">
            <div className="grid gap-3 p-4">
                <div className="grid grid-cols-3 gap-2">
                    <Button asChild variant="secondary" className="h-16 flex-col gap-1 text-xs">
                        <Link href={route('store.inventory.restock', store.id)}>
                            <PackagePlus className="size-5" /> Reponer
                        </Link>
                    </Button>
                    <Button asChild variant="secondary" className="h-16 flex-col gap-1 text-xs">
                        <Link href={route('store.inventory.count', store.id)}>
                            <ClipboardCheck className="size-5" /> Contar
                        </Link>
                    </Button>
                    <Button asChild variant="secondary" className="h-16 flex-col gap-1 text-xs">
                        <Link href={route('store.inventory.movements', store.id)}>
                            <History className="size-5" /> Historial
                        </Link>
                    </Button>
                </div>

                <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Filtro de inventario">
                    {filters.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            role="tab"
                            aria-selected={filter === item.value}
                            onClick={() =>
                                router.get(
                                    route('store.inventory.index', { store: store.id, filter: item.value }),
                                    {},
                                    { preserveScroll: true, preserveState: true, replace: true },
                                )
                            }
                            className={cn(
                                'h-10 shrink-0 rounded-full border px-4 text-sm font-medium',
                                filter === item.value ? 'bg-primary text-primary-foreground border-transparent' : 'bg-background',
                            )}
                        >
                            {item.label}
                            {item.count ? ` (${item.count})` : ''}
                        </button>
                    ))}
                </div>
            </div>

            {products.length === 0 ? (
                <EmptyState
                    icon={PackageCheck}
                    title={filter === 'all' ? 'Sin productos todavía' : 'Todo en orden'}
                    description={filter === 'all' ? 'Crea productos para empezar a llevar el inventario.' : 'No hay productos en este filtro.'}
                />
            ) : (
                <ul className="divide-y border-y">
                    {products.map((product) => (
                        <li key={product.id}>
                            <button
                                type="button"
                                onClick={() => open(product)}
                                className="hover:bg-accent flex min-h-[4.5rem] w-full items-center gap-3 px-4 py-2.5 text-left"
                            >
                                <ProductThumb src={product.image_url} name={product.name} className="size-12" />
                                <span className="min-w-0 flex-1 truncate font-medium">{product.name}</span>
                                <StockBadge stock={product.stock} minStock={product.min_stock} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <BottomSheet
                open={adjusting !== null}
                onOpenChange={(isOpen) => !isOpen && setAdjusting(null)}
                title={adjusting?.name ?? ''}
                description="Corrige el stock de este producto"
            >
                {adjusting && (
                    <form onSubmit={submit} className="grid gap-5">
                        <div className="flex items-center justify-between rounded-xl border p-3">
                            <span className="text-muted-foreground text-sm">Stock actual</span>
                            <StockBadge stock={adjusting.stock} minStock={adjusting.min_stock} className="text-sm" />
                        </div>

                        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de ajuste">
                            {modes.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={mode === item.value}
                                    onClick={() => setMode(item.value)}
                                    className={cn(
                                        'min-h-14 rounded-xl border px-2 py-2 text-sm font-medium',
                                        mode === item.value ? 'border-primary bg-primary/10 text-primary' : 'bg-background',
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-muted-foreground -mt-3 text-center text-xs">{modes.find((item) => item.value === mode)?.hint}</p>

                        <div className="flex justify-center">
                            <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={100000} />
                        </div>

                        <FormField
                            label="Nota (opcional)"
                            value={data.note}
                            onChange={(event) => setData('note', event.target.value)}
                            error={errors.note}
                            placeholder="Ej. Llegó caja extra"
                        />

                        <Button type="submit" size="lg" disabled={processing}>
                            {processing && <LoaderCircle className="animate-spin" />}
                            Guardar ajuste
                        </Button>
                    </form>
                )}
            </BottomSheet>
        </StoreLayout>
    );
}
