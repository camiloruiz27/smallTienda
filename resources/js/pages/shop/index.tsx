import BarcodeScanButton from '@/components/barcode-scan-button';
import BottomSheet from '@/components/bottom-sheet';
import InputError from '@/components/input-error';
import QuantityStepper from '@/components/quantity-stepper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/hooks/use-cart';
import ShopLayout from '@/layouts/shop-layout';
import { formatCOP } from '@/lib/format';
import { readJson, writeJson } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { type Category, type PaymentMethodOption } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { Check, LoaderCircle, Package, Plus, Search, ShoppingBasket } from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

interface ShopProduct {
    id: number;
    name: string;
    barcode: string | null;
    price: number;
    category_id: number | null;
    image_url: string | null;
}

interface ShopProps {
    store: { name: string; token: string };
    paymentMethods: PaymentMethodOption[];
    categories: Category[];
    products: ShopProduct[];
}

interface CustomerPrefs {
    name: string;
    paymentMethod: string;
}

export default function Shop({ store, paymentMethods, categories, products }: ShopProps) {
    const { errors } = usePage().props as { errors: Record<string, string> };
    const cart = useCart(store.token);
    const prefsKey = `smalltienda:customer:${store.token}`;

    const [query, setQuery] = useState('');
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [name, setName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]?.value ?? '');
    const [website, setWebsite] = useState('');

    useEffect(() => {
        const prefs = readJson<Partial<CustomerPrefs>>(prefsKey, {});
        setName(prefs.name ?? '');
        if (prefs.paymentMethod && paymentMethods.some((method) => method.value === prefs.paymentMethod)) {
            setPaymentMethod(prefs.paymentMethod);
        }
    }, [prefsKey, paymentMethods]);

    useEffect(() => {
        if (!notice) {
            return;
        }
        const timeout = window.setTimeout(() => setNotice(null), 2500);

        return () => window.clearTimeout(timeout);
    }, [notice]);

    const productsById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
    const cartLines = cart.lines.filter((line) => productsById.has(line.productId));
    const itemCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
    const total = cartLines.reduce((sum, line) => sum + (productsById.get(line.productId)?.price ?? 0) * line.quantity, 0);

    const visible = useMemo(() => {
        const term = query.trim().toLowerCase();

        return products.filter(
            (product) => (categoryId === null || product.category_id === categoryId) && (term === '' || product.name.toLowerCase().includes(term)),
        );
    }, [products, query, categoryId]);

    const handleScan = (code: string) => {
        const match = products.find((product) => product.barcode === code);
        if (match) {
            cart.add(match.id);
            setNotice(`Agregado: ${match.name}`);
        } else {
            setNotice('No encontramos ese producto. Búscalo por nombre.');
        }
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        if (cartLines.length === 0 || submitting) {
            return;
        }

        writeJson(prefsKey, { name, paymentMethod } satisfies CustomerPrefs);
        setSubmitting(true);
        router.post(
            route('shop.checkout', store.token),
            {
                submission_id: cart.submissionId,
                items: cartLines.map((line) => ({ product_id: line.productId, quantity: line.quantity })),
                payment_method: paymentMethod,
                customer_name: name,
                website,
            },
            {
                onSuccess: () => cart.clear(),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const search = (
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
            <BarcodeScanButton onDetect={handleScan} label="Escanear producto" />
        </div>
    );

    return (
        <ShopLayout storeName={store.name} storeToken={store.token} sticky={search}>
            {categories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto px-4 pt-3" role="tablist" aria-label="Categorías">
                    {[{ id: null, name: 'Todo' }, ...categories].map((category) => (
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

            {products.length === 0 ? (
                <p className="text-muted-foreground px-6 py-20 text-center">Esta tienda aún no tiene productos disponibles.</p>
            ) : (
                <>
                    {cartLines.length === 0 && query === '' && (
                        <p className="text-muted-foreground px-4 pt-3 text-sm">
                            Toca los productos que tomaste. Al final registras tu compra y pagas como prefieras.
                        </p>
                    )}

                    <ul className="grid grid-cols-2 gap-3 p-4 pb-32">
                        {visible.map((product) => {
                            const quantity = cart.quantityOf(product.id);

                            return (
                                <li
                                    key={product.id}
                                    className={cn(
                                        'bg-card flex flex-col overflow-hidden rounded-2xl border shadow-xs',
                                        quantity > 0 && 'border-primary ring-primary/30 ring-2',
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() => cart.add(product.id)}
                                        className="text-left"
                                        aria-label={`Agregar ${product.name}`}
                                    >
                                        <div className="bg-muted text-muted-foreground relative flex aspect-square items-center justify-center">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt="" loading="lazy" className="size-full object-cover" />
                                            ) : (
                                                <Package className="size-10" aria-hidden />
                                            )}
                                        </div>
                                        <div className="p-3 pb-2">
                                            <p className="line-clamp-2 min-h-10 text-sm leading-5 font-medium">{product.name}</p>
                                            <p className="mt-1 text-base font-bold tabular-nums">{formatCOP(product.price)}</p>
                                        </div>
                                    </button>
                                    <div className="mt-auto p-2 pt-0">
                                        {quantity === 0 ? (
                                            <Button className="h-11 w-full" variant="secondary" onClick={() => cart.add(product.id)}>
                                                <Plus /> Agregar
                                            </Button>
                                        ) : (
                                            <QuantityStepper
                                                value={quantity}
                                                onChange={(next) => cart.setQuantity(product.id, next)}
                                                max={cart.maxPerLine}
                                                label={`Cantidad de ${product.name}`}
                                                className="w-full justify-between"
                                            />
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    {visible.length === 0 && (
                        <p className="text-muted-foreground -mt-24 px-6 pb-32 text-center text-sm">No encontramos productos con “{query}”.</p>
                    )}
                </>
            )}

            {notice && (
                <div className="pointer-events-none fixed inset-x-0 bottom-28 z-40 flex justify-center px-4" role="status" aria-live="polite">
                    <p className="bg-foreground text-background animate-in fade-in slide-in-from-bottom-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg">
                        {notice}
                    </p>
                </div>
            )}

            {itemCount > 0 && (
                <div className="pb-safe fixed inset-x-0 bottom-0 z-40 p-3">
                    <button
                        type="button"
                        onClick={() => setCartOpen(true)}
                        className="bg-primary text-primary-foreground mx-auto flex h-16 w-full max-w-lg items-center gap-3 rounded-2xl px-5 shadow-xl active:scale-[0.99]"
                    >
                        <span className="bg-primary-foreground/20 flex size-9 items-center justify-center rounded-full text-sm font-bold">
                            {itemCount}
                        </span>
                        <span className="flex-1 text-left text-base font-semibold">Ver mi compra</span>
                        <span className="text-lg font-bold tabular-nums">{formatCOP(total)}</span>
                    </button>
                </div>
            )}

            <BottomSheet open={cartOpen} onOpenChange={setCartOpen} title="Tu compra">
                {cartLines.length === 0 ? (
                    <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
                        <ShoppingBasket className="size-10" />
                        <p>Aún no has agregado nada.</p>
                    </div>
                ) : (
                    <form onSubmit={submit} className="grid gap-4">
                        <ul className="divide-y">
                            {cartLines.map((line) => {
                                const product = productsById.get(line.productId)!;

                                return (
                                    <li key={line.productId} className="flex items-center gap-2 py-1.5">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{product.name}</p>
                                            <p className="text-muted-foreground text-xs tabular-nums">{formatCOP(product.price * line.quantity)}</p>
                                        </div>
                                        <QuantityStepper
                                            compact
                                            value={line.quantity}
                                            onChange={(next) => cart.setQuantity(product.id, next)}
                                            max={cart.maxPerLine}
                                            label={`Cantidad de ${product.name}`}
                                        />
                                    </li>
                                );
                            })}
                        </ul>

                        <fieldset>
                            <legend className="sr-only">Cómo vas a pagar</legend>
                            <div className="bg-muted grid auto-cols-fr grid-flow-col gap-1 rounded-xl p-1">
                                {paymentMethods.map((method) => (
                                    <label
                                        key={method.value}
                                        className={cn(
                                            'flex h-11 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold',
                                            paymentMethod === method.value ? 'bg-background text-primary shadow-xs' : 'text-muted-foreground',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value={method.value}
                                            checked={paymentMethod === method.value}
                                            onChange={() => setPaymentMethod(method.value)}
                                            className="sr-only"
                                        />
                                        {method.label}
                                    </label>
                                ))}
                            </div>
                            <InputError message={errors.payment_method} className="mt-1" />
                        </fieldset>

                        <div className="grid gap-1">
                            <Input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                autoComplete="name"
                                placeholder="Tu nombre (opcional)"
                                aria-label="Tu nombre (opcional)"
                            />
                            <InputError message={errors.customer_name} />
                        </div>

                        <div className="sr-only" aria-hidden>
                            <label>
                                No llenar este campo
                                <input
                                    name="website"
                                    value={website}
                                    onChange={(event) => setWebsite(event.target.value)}
                                    tabIndex={-1}
                                    autoComplete="off"
                                />
                            </label>
                        </div>

                        <InputError message={errors.items} />
                        <InputError message={errors.submission_id} />
                        <InputError message={errors.website} />

                        <Button type="submit" size="lg" className="h-14 text-base" disabled={submitting}>
                            {submitting ? <LoaderCircle className="animate-spin" /> : <Check />}
                            Confirmar · {formatCOP(total)}
                        </Button>
                    </form>
                )}
            </BottomSheet>
        </ShopLayout>
    );
}
