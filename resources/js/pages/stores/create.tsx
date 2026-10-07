import FlashMessage from '@/components/flash-message';
import FormField from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle, Store } from 'lucide-react';
import { FormEventHandler } from 'react';

export default function CreateStore() {
    const { userStores } = usePage<SharedData>().props;
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        payment_key: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('stores.store'));
    };

    return (
        <div className="bg-background pt-safe pb-safe min-h-svh">
            <Head title="Crear tienda" />
            <FlashMessage />

            <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-8">
                <div className="flex flex-col items-center gap-3 text-center">
                    <span className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-2xl">
                        <Store className="size-8" />
                    </span>
                    <h1 className="text-2xl font-semibold">{userStores.length === 0 ? 'Crea tu tienda' : 'Nueva tienda'}</h1>
                    <p className="text-muted-foreground text-sm">
                        Tus clientes escanean un QR, registran lo que toman y tú controlas el inventario desde el celular.
                    </p>
                </div>

                <form onSubmit={submit} className="grid gap-5">
                    <FormField
                        label="Nombre de la tienda"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        error={errors.name}
                        placeholder="Ej. Tienda Piso 3"
                        autoComplete="off"
                        autoFocus
                        required
                    />

                    <FormField
                        label="Tu llave Bre-B (opcional)"
                        value={data.payment_key}
                        onChange={(event) => setData('payment_key', event.target.value)}
                        error={errors.payment_key}
                        placeholder="Celular, correo o @llave"
                        autoComplete="off"
                        hint="Tus clientes la ven al pagar. El QR de pago lo subes después, en Configuración."
                    />

                    <Button type="submit" size="lg" disabled={processing}>
                        {processing && <LoaderCircle className="animate-spin" />}
                        Crear tienda
                    </Button>
                    {userStores.length > 0 && (
                        <Button variant="ghost" asChild>
                            <Link href={route('stores.index')}>Cancelar</Link>
                        </Button>
                    )}
                </form>
            </div>
        </div>
    );
}
