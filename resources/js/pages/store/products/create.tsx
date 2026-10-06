import ProductForm from '@/components/product-form';
import StoreLayout from '@/layouts/store-layout';
import { type Category, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function CreateProduct({ categories, barcode }: { categories: Category[]; barcode: string | null }) {
    const store = usePage<SharedData>().props.currentStore!;

    return (
        <StoreLayout title="Nuevo producto" back={route('store.products.index', store.id)} hideNav>
            <ProductForm
                categories={categories}
                action={route('store.products.store', store.id)}
                method="post"
                submitLabel="Guardar producto"
                initial={{ barcode: barcode ?? '' }}
                showInitialStock
            />
        </StoreLayout>
    );
}
