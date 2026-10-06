import BarcodeScanButton from '@/components/barcode-scan-button';
import ProductThumb from '@/components/product-thumb';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface PickableProduct {
    id: number;
    name: string;
    barcode: string | null;
    stock: number;
    image_url: string | null;
}

interface ProductPickerProps<T extends PickableProduct> {
    products: T[];
    onPick: (product: T) => void;
    /** Ids already in the list, shown as added so the user does not pick them twice by accident. */
    pickedIds?: number[];
    placeholder?: string;
}

/**
 * Search-by-name-or-barcode field with a results list. Used wherever the owner builds a list of products
 * (restocking), including a camera scan shortcut that picks the matching product directly.
 */
export default function ProductPicker<T extends PickableProduct>({
    products,
    onPick,
    pickedIds = [],
    placeholder = 'Buscar producto o código',
}: ProductPickerProps<T>) {
    const [query, setQuery] = useState('');
    const [notice, setNotice] = useState<string | null>(null);

    const results = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (term === '') {
            return [];
        }

        return products
            .filter((product) => product.name.toLowerCase().includes(term) || (product.barcode ?? '').toLowerCase().includes(term))
            .slice(0, 8);
    }, [products, query]);

    const pick = (product: T) => {
        onPick(product);
        setQuery('');
        setNotice(null);
    };

    const handleScan = (code: string) => {
        const match = products.find((product) => product.barcode === code);
        if (match) {
            pick(match);
        } else {
            setNotice(`No hay ningún producto con el código ${code}.`);
        }
    };

    return (
        <div className="grid gap-2">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 size-5 -translate-y-1/2" aria-hidden />
                    <Input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={placeholder}
                        className="pl-10"
                        aria-label="Buscar producto"
                        enterKeyHint="search"
                    />
                </div>
                <BarcodeScanButton onDetect={handleScan} />
            </div>

            {notice && <p className="text-warning text-sm">{notice}</p>}

            {results.length > 0 && (
                <ul className="divide-y overflow-hidden rounded-xl border">
                    {results.map((product) => (
                        <li key={product.id}>
                            <button
                                type="button"
                                onClick={() => pick(product)}
                                className="hover:bg-accent flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left"
                            >
                                <ProductThumb src={product.image_url} name={product.name} className="size-10" />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium">{product.name}</span>
                                    <span className="text-muted-foreground block text-xs">Stock actual: {product.stock}</span>
                                </span>
                                {pickedIds.includes(product.id) ? (
                                    <span className="text-muted-foreground text-xs">Ya agregado</span>
                                ) : (
                                    <Plus className="text-primary size-5" />
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {query.trim() !== '' && results.length === 0 && <p className="text-muted-foreground text-sm">Sin resultados para “{query}”.</p>}
        </div>
    );
}
