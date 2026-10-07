import BottomSheet from '@/components/bottom-sheet';
import EmptyState from '@/components/empty-state';
import FormField from '@/components/form-field';
import { Button } from '@/components/ui/button';
import StoreLayout from '@/layouts/store-layout';
import { type SharedData } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface CategoryRow {
    id: number;
    name: string;
    products_count: number;
}

export default function Categories({ categories }: { categories: CategoryRow[] }) {
    const store = usePage<SharedData>().props.currentStore!;
    const [editing, setEditing] = useState<CategoryRow | 'new' | null>(null);
    const [deleting, setDeleting] = useState<CategoryRow | null>(null);
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({ name: '' });

    const open = (target: CategoryRow | 'new') => {
        clearErrors();
        setData('name', target === 'new' ? '' : target.name);
        setEditing(target);
    };

    const close = () => {
        setEditing(null);
        reset();
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: close };

        if (editing === 'new') {
            post(route('store.categories.store', store.id), options);
        } else if (editing) {
            put(route('store.categories.update', [store.id, editing.id]), options);
        }
    };

    return (
        <StoreLayout
            title="Categorías"
            back={route('store.products.index', store.id)}
            action={
                <Button size="sm" className="rounded-full" onClick={() => open('new')}>
                    <Plus /> Nueva
                </Button>
            }
            hideNav
        >
            {categories.length === 0 ? (
                <EmptyState
                    icon={Tags}
                    title="Sin categorías"
                    description="Agrupa tus productos (bebidas, snacks, aseo…) para que tus clientes los encuentren más rápido."
                >
                    <Button size="lg" onClick={() => open('new')}>
                        Crear categoría
                    </Button>
                </EmptyState>
            ) : (
                <ul className="divide-y border-y">
                    {categories.map((category) => (
                        <li key={category.id} className="flex min-h-16 items-center gap-2 px-4">
                            <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{category.name}</span>
                                <span className="text-muted-foreground block text-xs">{category.products_count} productos</span>
                            </span>
                            <Button variant="ghost" size="icon" onClick={() => open(category)} aria-label={`Renombrar ${category.name}`}>
                                <Pencil />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => setDeleting(category)}
                                aria-label={`Eliminar ${category.name}`}
                            >
                                <Trash2 />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            <BottomSheet
                open={editing !== null}
                onOpenChange={(isOpen) => !isOpen && close()}
                title={editing === 'new' ? 'Nueva categoría' : 'Renombrar categoría'}
            >
                <form onSubmit={submit} className="grid gap-4">
                    <FormField
                        label="Nombre"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        error={errors.name}
                        autoFocus
                        autoComplete="off"
                        required
                    />
                    <Button type="submit" size="lg" disabled={processing}>
                        {processing && <LoaderCircle className="animate-spin" />}
                        Guardar
                    </Button>
                </form>
            </BottomSheet>

            <BottomSheet
                open={deleting !== null}
                onOpenChange={(isOpen) => !isOpen && setDeleting(null)}
                title={`¿Eliminar “${deleting?.name ?? ''}”?`}
                description="Sus productos no se borran: quedan sin categoría."
            >
                <div className="grid gap-2">
                    <Button
                        variant="destructive"
                        size="lg"
                        onClick={() =>
                            deleting &&
                            router.delete(route('store.categories.destroy', [store.id, deleting.id]), {
                                preserveScroll: true,
                                onSuccess: () => setDeleting(null),
                            })
                        }
                    >
                        Sí, eliminar
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => setDeleting(null)}>
                        Cancelar
                    </Button>
                </div>
            </BottomSheet>
        </StoreLayout>
    );
}
