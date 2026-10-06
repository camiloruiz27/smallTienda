import BarcodeScanButton from '@/components/barcode-scan-button';
import ProductThumb from '@/components/product-thumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StoreLayout from '@/layouts/store-layout';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { LoaderCircle, Search } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

interface CountProduct {
    id: number;
    name: string;
    barcode: string | null;
    stock: number;
    image_url: string | null;
}

export default function Count({ products }: { products: CountProduct[] }) {
    const store = usePage<SharedData>().props.currentStore!;
    const [counted, setCounted] = useState<Record<number, string>>({});
    const [query, setQuery] = useState('');
    const [processing, setProcessing] = useState(false);
    const inputs = useRef<Record<number, HTMLInputElement | null>>({});

    const visible = useMemo(() => {
        const term = query.trim().toLowerCase();

        return term === ''
            ? products
            : products.filter((product) => product.name.toLowerCase().includes(term) || (product.barcode ?? '').includes(term));
    }, [products, query]);

    const entries = Object.entries(counted).filter(([, value]) => value !== '');
    const differences = entries.filter(([id, value]) => products.find((product) => product.id === Number(id))?.stock !== Number(value)).length;

    const handleScan = (code: string) => {
        const match = products.find((product) => product.barcode === code);
        if (match) {
            setQuery('');
            window.setTimeout(() => {
                inputs.current[match.id]?.focus();
                inputs.current[match.id]?.scrollIntoView({ block: 'center' });
            }, 50);
        } else {
            setQuery(code);
        }
    };

    const save = () => {
        setProcessing(true);
        router.post(
            route('store.inventory.count.store', store.id),
            { items: entries.map(([id, value]) => ({ product_id: Number(id), counted: Number(value) })) },
            { onFinish: () => setProcessing(false) },
        );
    };

    return (
        <StoreLayout title="Contar inventario" back={route('store.inventory.index', store.id)} hideNav>
            <div className="grid gap-3 p-4 pb-32">
                <p className="text-muted-foreground text-sm">
                    Escribe cuántas unidades hay realmente en la tienda. Solo se corrigen los productos que cuentes y cuya cantidad sea distinta.
                </p>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 size-5 -translate-y-1/2" aria-hidden />
                        <Input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Buscar producto"
                            className="pl-10"
                            aria-label="Buscar producto"
                        />
                    </div>
                    <BarcodeScanButton onDetect={handleScan} />
                </div>

                <ul className="divide-y overflow-hidden rounded-2xl border">
                    {visible.map((product) => {
                        const value = counted[product.id] ?? '';
                        const differs = value !== '' && Number(value) !== product.stock;

                        return (
                            <li key={product.id} className={cn('flex min-h-[4.5rem] items-center gap-3 px-3 py-2', differs && 'bg-warning/10')}>
                                <ProductThumb src={product.image_url} name={product.name} className="size-11" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">{product.name}</p>
                                    <p className="text-muted-foreground text-xs">
                                        Sistema: {product.stock}
                                        {differs && (
                                            <span className="text-warning font-semibold">
                                                {' '}
                                                · diferencia {Number(value) - product.stock > 0 ? '+' : ''}
                                                {Number(value) - product.stock}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <Input
                                    ref={(element) => {
                                        inputs.current[product.id] = element;
                                    }}
                                    value={value}
                                    onChange={(event) =>
                                        setCounted((current) => ({ ...current, [product.id]: event.target.value.replace(/\D/g, '') }))
                                    }
                                    inputMode="numeric"
                                    placeholder="—"
                                    className="w-20 text-center text-lg font-semibold"
                                    aria-label={`Cantidad contada de ${product.name}`}
                                    onFocus={(event) => event.target.select()}
                                />
                            </li>
                        );
                    })}
                </ul>
                {visible.length === 0 && <p className="text-muted-foreground py-6 text-center text-sm">Ningún producto coincide.</p>}
            </div>

            <div className="bg-background/95 pb-safe fixed inset-x-0 bottom-0 z-30 border-t p-4 backdrop-blur">
                <div className="mx-auto max-w-2xl">
                    <Button size="lg" className="w-full" onClick={save} disabled={processing || entries.length === 0}>
                        {processing && <LoaderCircle className="animate-spin" />}
                        {entries.length === 0
                            ? 'Cuenta al menos un producto'
                            : `Guardar conteo · ${entries.length} contados, ${differences} con diferencia`}
                    </Button>
                </div>
            </div>
        </StoreLayout>
    );
}
