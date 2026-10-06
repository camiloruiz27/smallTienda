import EmptyState from '@/components/empty-state';
import FormField from '@/components/form-field';
import ProductPicker, { type PickableProduct } from '@/components/product-picker';
import ProductThumb from '@/components/product-thumb';
import QuantityStepper from '@/components/quantity-stepper';
import { Button } from '@/components/ui/button';
import StoreLayout from '@/layouts/store-layout';
import { type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { LoaderCircle, PackagePlus, X } from 'lucide-react';
import { useState } from 'react';

interface RestockProduct extends PickableProduct {
    cost: number | null;
}

interface RestockLine {
    product: RestockProduct;
    quantity: number;
    unitCost: string;
}

export default function Restock({ products }: { products: RestockProduct[] }) {
    const store = usePage<SharedData>().props.currentStore!;
    const [lines, setLines] = useState<RestockLine[]>([]);
    const [note, setNote] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const pick = (product: RestockProduct) => {
        setLines((current) =>
            current.some((line) => line.product.id === product.id)
                ? current.map((line) => (line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line))
                : [{ product, quantity: 1, unitCost: product.cost === null ? '' : String(product.cost) }, ...current],
        );
    };

    const update = (productId: number, changes: Partial<Omit<RestockLine, 'product'>>) => {
        setLines((current) => current.map((line) => (line.product.id === productId ? { ...line, ...changes } : line)));
    };

    const totalUnits = lines.reduce((sum, line) => sum + line.quantity, 0);

    const save = () => {
        setProcessing(true);
        router.post(
            route('store.inventory.restock.store', store.id),
            {
                note,
                items: lines.map((line) => ({
                    product_id: line.product.id,
                    quantity: line.quantity,
                    unit_cost: line.unitCost === '' ? null : Number(line.unitCost),
                })),
            },
            {
                onError: (serverErrors) => setErrors(serverErrors),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <StoreLayout title="Reponer inventario" back={route('store.inventory.index', store.id)} hideNav>
            <div className="grid gap-4 p-4 pb-32">
                <ProductPicker products={products} onPick={pick} pickedIds={lines.map((line) => line.product.id)} />

                {lines.length === 0 ? (
                    <EmptyState
                        icon={PackagePlus}
                        title="Agrega lo que llegó"
                        description="Busca el producto o escanea su código de barras y escribe cuántas unidades recibiste."
                    />
                ) : (
                    <>
                        <ul className="grid gap-3">
                            {lines.map((line) => (
                                <li key={line.product.id} className="grid gap-3 rounded-2xl border p-3">
                                    <div className="flex items-center gap-3">
                                        <ProductThumb src={line.product.image_url} name={line.product.name} className="size-11" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium">{line.product.name}</p>
                                            <p className="text-muted-foreground text-xs">
                                                Hay {line.product.stock} → quedarán {line.product.stock + line.quantity}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setLines((current) => current.filter((item) => item.product.id !== line.product.id))}
                                            className="hover:bg-accent flex size-11 items-center justify-center rounded-full"
                                            aria-label={`Quitar ${line.product.name}`}
                                        >
                                            <X className="size-5" />
                                        </button>
                                    </div>
                                    <div className="flex items-end justify-between gap-3">
                                        <QuantityStepper
                                            value={line.quantity}
                                            onChange={(quantity) => update(line.product.id, { quantity })}
                                            min={1}
                                            max={100000}
                                        />
                                        <div className="w-32">
                                            <FormField
                                                label="Costo unidad"
                                                value={line.unitCost}
                                                onChange={(event) => update(line.product.id, { unitCost: event.target.value.replace(/\D/g, '') })}
                                                inputMode="numeric"
                                                placeholder="Opcional"
                                            />
                                        </div>
                                    </div>
                                    {errors[`items.${lines.indexOf(line)}.quantity`] && (
                                        <p className="text-destructive text-sm">{errors[`items.${lines.indexOf(line)}.quantity`]}</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                        <FormField
                            label="Nota (opcional)"
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            placeholder="Ej. Compra en la plaza"
                            error={errors.note}
                        />
                        {errors.items && <p className="text-destructive text-sm">{errors.items}</p>}
                    </>
                )}
            </div>

            {lines.length > 0 && (
                <div className="bg-background/95 pb-safe fixed inset-x-0 bottom-0 z-30 border-t p-4 backdrop-blur">
                    <div className="mx-auto max-w-2xl">
                        <Button size="lg" className="w-full" onClick={save} disabled={processing}>
                            {processing && <LoaderCircle className="animate-spin" />}
                            Guardar reposición · {totalUnits} {totalUnits === 1 ? 'unidad' : 'unidades'}
                        </Button>
                    </div>
                </div>
            )}
        </StoreLayout>
    );
}
