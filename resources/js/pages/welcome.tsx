import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { Boxes, QrCode, Receipt, Smartphone, Store } from 'lucide-react';

const steps = [
    { icon: QrCode, title: 'El cliente escanea el QR', text: 'Sin descargar apps ni crear cuentas: abre la tienda en su celular.' },
    { icon: Smartphone, title: 'Registra lo que toma', text: 'Elige los productos, confirma y ve el total con cómo pagar.' },
    {
        icon: Boxes,
        title: 'Tu inventario se actualiza solo',
        text: 'Cada compra descuenta stock. Tú confirmas pagos y cuentas el inventario cuando quieras.',
    },
];

export default function Welcome() {
    return (
        <div className="bg-background pt-safe pb-safe min-h-svh">
            <Head title="Inventario para tiendas de autoservicio" />

            <main className="mx-auto flex max-w-md flex-col gap-10 px-6 py-12">
                <header className="flex flex-col items-center gap-5 text-center">
                    <span className="bg-primary text-primary-foreground flex size-20 items-center justify-center rounded-3xl">
                        <Store className="size-10" />
                    </span>
                    <h1 className="text-3xl leading-tight font-bold tracking-tight">Tu tienda de autoservicio, con inventario al día</h1>
                    <p className="text-muted-foreground">
                        Tus clientes registran lo que toman desde el celular. Tú llevas el control sin estar presente.
                    </p>
                </header>

                <div className="grid gap-3">
                    <Button asChild size="lg">
                        <Link href={route('register')}>Crear mi tienda</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                        <Link href={route('login')}>Ya tengo cuenta</Link>
                    </Button>
                </div>

                <ol className="grid gap-4">
                    {steps.map(({ icon: Icon, title, text }) => (
                        <li key={title} className="flex gap-4 rounded-2xl border p-4">
                            <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                                <Icon className="size-6" />
                            </span>
                            <div>
                                <h2 className="font-semibold">{title}</h2>
                                <p className="text-muted-foreground text-sm">{text}</p>
                            </div>
                        </li>
                    ))}
                </ol>

                <p className="text-muted-foreground flex items-center justify-center gap-2 text-center text-xs">
                    <Receipt className="size-4" /> Pagos en efectivo o con llave Bre-B, confirmados por ti.
                </p>
            </main>
        </div>
    );
}
