import BarcodeScanButton from '@/components/barcode-scan-button';
import FormField from '@/components/form-field';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCOP } from '@/lib/format';
import { compressImage } from '@/lib/image';
import { type Category } from '@/types';
import { useForm } from '@inertiajs/react';
import { Camera, LoaderCircle, Trash2 } from 'lucide-react';
import { ChangeEvent, FormEventHandler, useRef, useState } from 'react';

export type ProductFormValues = {
    name: string;
    barcode: string;
    price: string;
    cost: string;
    min_stock: string;
    category_id: string;
    is_active: boolean;
    initial_stock: string;
    image: File | null;
    remove_image: boolean;
};

interface ProductFormProps {
    categories: Category[];
    action: string;
    method: 'post' | 'put';
    initial?: Partial<ProductFormValues>;
    currentImageUrl?: string | null;
    submitLabel: string;
    /** Only shown on create: the stock the product starts with. */
    showInitialStock?: boolean;
    children?: React.ReactNode;
}

const selectClass =
    'border-input bg-background ring-offset-background focus-visible:ring-ring flex h-11 w-full rounded-md border px-3 text-base focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden md:text-sm';

export default function ProductForm({
    categories,
    action,
    method,
    initial,
    currentImageUrl = null,
    submitLabel,
    showInitialStock = false,
    children,
}: ProductFormProps) {
    const fileInput = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(currentImageUrl);

    const { data, setData, post, processing, errors, transform } = useForm<ProductFormValues>({
        name: '',
        barcode: '',
        price: '',
        cost: '',
        min_stock: '0',
        category_id: '',
        is_active: true,
        initial_stock: '0',
        image: null,
        remove_image: false,
        ...initial,
    });

    const handleImage = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const compressed = await compressImage(file);
        setData((current) => ({ ...current, image: compressed, remove_image: false }));
        setPreview(URL.createObjectURL(compressed));
    };

    const removeImage = () => {
        setData((current) => ({ ...current, image: null, remove_image: true }));
        setPreview(null);
        if (fileInput.current) {
            fileInput.current.value = '';
        }
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        // PUT with files needs method spoofing: PHP only parses multipart bodies on POST.
        transform((values) => (method === 'put' ? { ...values, _method: 'put' } : values));
        post(action, { forceFormData: true, preserveScroll: true });
    };

    const price = parseInt(data.price, 10);
    const cost = parseInt(data.cost, 10);
    const margin = Number.isFinite(price) && Number.isFinite(cost) && price > 0 ? Math.round(((price - cost) / price) * 100) : null;

    return (
        <form onSubmit={submit} className="grid gap-5 p-4 pb-32">
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="bg-muted text-muted-foreground flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed"
                    aria-label={preview ? 'Cambiar foto' : 'Agregar foto'}
                >
                    {preview ? <img src={preview} alt="" className="size-full object-cover" /> : <Camera className="size-8" />}
                </button>
                <input
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={handleImage}
                    tabIndex={-1}
                    aria-hidden
                />
                <div className="grid gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => fileInput.current?.click()}>
                        <Camera /> {preview ? 'Cambiar foto' : 'Tomar foto'}
                    </Button>
                    {preview && (
                        <Button type="button" variant="ghost" size="sm" onClick={removeImage} className="text-destructive">
                            <Trash2 /> Quitar
                        </Button>
                    )}
                    <InputError message={errors.image} />
                </div>
            </div>

            <FormField
                label="Nombre"
                value={data.name}
                onChange={(event) => setData('name', event.target.value)}
                error={errors.name}
                placeholder="Ej. Agua 600 ml"
                autoComplete="off"
                required
            />

            <div className="grid gap-1.5">
                <Label htmlFor="barcode">Código de barras (opcional)</Label>
                <div className="flex gap-2">
                    <Input
                        id="barcode"
                        value={data.barcode}
                        onChange={(event) => setData('barcode', event.target.value)}
                        inputMode="numeric"
                        placeholder="Escanéalo o escríbelo"
                        autoComplete="off"
                    />
                    <BarcodeScanButton onDetect={(code) => setData('barcode', code)} />
                </div>
                <InputError message={errors.barcode} />
            </div>

            <div className="grid grid-cols-2 items-start gap-3">
                <FormField
                    label="Precio de venta"
                    value={data.price}
                    onChange={(event) => setData('price', event.target.value.replace(/\D/g, ''))}
                    error={errors.price}
                    inputMode="numeric"
                    placeholder="2500"
                    hint={Number.isFinite(price) ? formatCOP(price) : undefined}
                    required
                />
                <FormField
                    label="Costo (opcional)"
                    value={data.cost}
                    onChange={(event) => setData('cost', event.target.value.replace(/\D/g, ''))}
                    error={errors.cost}
                    inputMode="numeric"
                    placeholder="1500"
                    hint={margin !== null ? `Margen ${margin}%` : undefined}
                />
            </div>

            <div className={showInitialStock ? 'grid grid-cols-2 items-start gap-3' : 'grid'}>
                {showInitialStock && (
                    <FormField
                        label="Stock inicial"
                        value={data.initial_stock}
                        onChange={(event) => setData('initial_stock', event.target.value.replace(/\D/g, ''))}
                        error={errors.initial_stock}
                        inputMode="numeric"
                        onFocus={(event) => event.target.select()}
                    />
                )}
                <FormField
                    label="Avisar cuando queden"
                    value={data.min_stock}
                    onChange={(event) => setData('min_stock', event.target.value.replace(/\D/g, ''))}
                    error={errors.min_stock}
                    inputMode="numeric"
                    onFocus={(event) => event.target.select()}
                    hint="Unidades mínimas antes de marcarlo como bajo"
                />
            </div>

            <div className="grid gap-1.5">
                <Label htmlFor="category">Categoría</Label>
                <select
                    id="category"
                    value={data.category_id}
                    onChange={(event) => setData('category_id', event.target.value)}
                    className={selectClass}
                >
                    <option value="">Sin categoría</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
                <InputError message={errors.category_id} />
            </div>

            <label className="flex min-h-14 items-center justify-between gap-3 rounded-xl border px-4">
                <span>
                    <span className="block font-medium">Visible para clientes</span>
                    <span className="text-muted-foreground block text-xs">Si lo ocultas, no aparece en la tienda pero conserva su historial.</span>
                </span>
                <input
                    type="checkbox"
                    checked={data.is_active}
                    onChange={(event) => setData('is_active', event.target.checked)}
                    className="accent-primary size-6"
                />
            </label>

            {children}

            <div className="bg-background/95 pb-safe fixed inset-x-0 bottom-0 z-30 border-t p-4 backdrop-blur">
                <div className="mx-auto max-w-2xl">
                    <Button type="submit" size="lg" className="w-full" disabled={processing}>
                        {processing && <LoaderCircle className="animate-spin" />}
                        {submitLabel}
                    </Button>
                </div>
            </div>
        </form>
    );
}
