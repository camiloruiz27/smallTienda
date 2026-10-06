import BottomSheet from '@/components/bottom-sheet';
import ProductForm from '@/components/product-form';
import StockBadge from '@/components/stock-badge';
import { Button } from '@/components/ui/button';
import StoreLayout from '@/layouts/store-layout';
import { type Category, type Product, type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { History, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface EditProductProps {
    product: Product & { cost: number | null };
    categories: Category[];
}

export default function EditProduct({ product, categories }: EditProductProps) {
    const store = usePage<SharedData>().props.currentStore!;
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    return (
        <StoreLayout title="Editar producto" back={route('store.products.index', store.id)} hideNav>
            <ProductForm
                categories={categories}
                action={route('store.products.update', [store.id, product.id])}
                method="put"
                submitLabel="Guardar cambios"
                currentImageUrl={product.image_url}
                initial={{
                    name: product.name,
                    barcode: product.barcode ?? '',
                    price: String(product.price),
                    cost: product.cost === null ? '' : String(product.cost),
                    min_stock: String(product.min_stock),
                    category_id: product.category_id === null ? '' : String(product.category_id),
                    is_active: product.is_active,
                }}
            >
                <div className="flex items-center justify-between gap-3 rounded-xl border p-4">
                    <div>
                        <p className="text-muted-foreground text-xs">Stock actual</p>
                        <StockBadge stock={product.stock} minStock={product.min_stock} className="mt-1 text-sm" />
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link href={route('store.inventory.movements', { store: store.id, product: product.id })}>
                            <History /> Historial
                        </Link>
                    </Button>
                </div>

                <Button type="button" variant="ghost" className="text-destructive justify-start" onClick={() => setConfirmingDelete(true)}>
                    <Trash2 /> Eliminar producto
                </Button>
            </ProductForm>

            <BottomSheet
                open={confirmingDelete}
                onOpenChange={setConfirmingDelete}
                title="¿Eliminar este producto?"
                description="Dejará de aparecer en la tienda. Su historial de ventas se conserva."
            >
                <div className="grid gap-2">
                    <Button variant="destructive" size="lg" onClick={() => router.delete(route('store.products.destroy', [store.id, product.id]))}>
                        Sí, eliminar
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => setConfirmingDelete(false)}>
                        Cancelar
                    </Button>
                </div>
            </BottomSheet>
        </StoreLayout>
    );
}
