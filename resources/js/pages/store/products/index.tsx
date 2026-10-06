import BarcodeScanButton from '@/components/barcode-scan-button';
import EmptyState from '@/components/empty-state';
import ProductThumb from '@/components/product-thumb';
import StockBadge from '@/components/stock-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StoreLayout from '@/layouts/store-layout';
import { formatCOP } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type Category, type Product, type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { Package, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ProductsIndexProps {
    products: Product[];
    categories: Category[];
}

export default function ProductsIndex({ products, categories }: ProductsIndexProps) {
    const store = usePage<SharedData>().props.currentStore!;
    const [query, setQuery] = useState('');
    const [categoryId, setCategoryId] = useState<number | 'none' | null>(null);
    const [notice, setNotice] = useState<{ code: string } | null>(null);

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();

        return products.filter((product) => {
            if (categoryId === 'none' && product.category_id !== null) {
                return false;
            }
            if (typeof categoryId === 'number' && product.category_id !== categoryId) {
                return false;
            }

            return term === '' || product.name.toLowerCase().includes(term) || (product.barcode ?? '').includes(term);
        });
    }, [products, query, categoryId]);

    const handleScan = (code: string) => {
        const match = products.find((product) => product.barcode === code);
        if (match) {
            router.visit(route('store.products.edit', [store.id, match.id]));
        } else {
            setNotice({ code });
        }
    };

    const createHref = route('store.products.create', store.id);

    return (
        <StoreLayout
            title="Productos"
            action={
                <Button asChild size="sm" className="rounded-full">
                    <Link href={createHref}>
                        <Plus /> Nuevo
                    </Link>
                </Button>
            }
        >
            <div className="grid gap-3 p-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 size-5 -translate-y-1/2" aria-hidden />
                        <Input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Buscar por nombre o código"
                            className="pl-10"
                            aria-label="Buscar producto"
                        />
                    </div>
                    <BarcodeScanButton onDetect={handleScan} />
                </div>

                {notice && (
                    <div className="bg-warning/10 flex items-center justify-between gap-3 rounded-xl p-3 text-sm">
                        <span>
                            No existe un producto con el código <strong>{notice.code}</strong>.
                        </span>
                        <Button asChild size="sm">
                            <Link href={route('store.products.create', { store: store.id, barcode: notice.code })}>Crearlo</Link>
                        </Button>
                    </div>
                )}

                {categories.length > 0 && (
                    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Categorías">
                        {[{ id: null, name: 'Todas' }, ...categories, { id: 'none' as const, name: 'Sin categoría' }].map((category) => (
                            <button
                                key={String(category.id)}
                                type="button"
                                role="tab"
                                aria-selected={categoryId === category.id}
                                onClick={() => setCategoryId(category.id)}
                                className={cn(
                                    'h-10 shrink-0 rounded-full border px-4 text-sm font-medium',
                                    categoryId === category.id ? 'bg-primary text-primary-foreground border-transparent' : 'bg-background',
                                )}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {products.length === 0 ? (
                <EmptyState
                    icon={Package}
                    title="Aún no hay productos"
                    description="Agrega los productos que vendes. Puedes escanear su código de barras con la cámara."
                >
                    <Button asChild size="lg">
                        <Link href={createHref}>Agregar el primero</Link>
                    </Button>
                </EmptyState>
            ) : filtered.length === 0 ? (
                <p className="text-muted-foreground px-4 py-10 text-center text-sm">Ningún producto coincide con tu búsqueda.</p>
            ) : (
                <ul className="divide-y border-y">
                    {filtered.map((product) => (
                        <li key={product.id}>
                            <Link
                                href={route('store.products.edit', [store.id, product.id])}
                                className="hover:bg-accent flex min-h-[4.5rem] items-center gap-3 px-4 py-2.5"
                                prefetch
                            >
                                <ProductThumb src={product.image_url} name={product.name} />
                                <span className="min-w-0 flex-1">
                                    <span className={cn('block truncate font-medium', !product.is_active && 'text-muted-foreground line-through')}>
                                        {product.name}
                                    </span>
                                    <span className="text-muted-foreground block text-sm tabular-nums">
                                        {formatCOP(product.price)}
                                        {!product.is_active && ' · Oculto'}
                                    </span>
                                </span>
                                <StockBadge stock={product.stock} minStock={product.min_stock} />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </StoreLayout>
    );
}
