import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import FormField from '@/components/form-field';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        post(route('password.email'));
    };

    return (
        <AuthLayout title="¿Olvidaste tu contraseña?" description="Escribe tu correo y te enviaremos un enlace para restablecerla">
            <Head title="Recuperar contraseña" />

            {status && <div className="text-success text-center text-sm font-medium">{status}</div>}

            <div className="grid gap-6">
                <form onSubmit={submit} className="grid gap-5">
                    <FormField
                        label="Correo electrónico"
                        type="email"
                        name="email"
                        autoComplete="off"
                        inputMode="email"
                        autoFocus
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        error={errors.email}
                        placeholder="tu@correo.com"
                    />

                    <Button size="lg" className="w-full" disabled={processing}>
                        {processing && <LoaderCircle className="animate-spin" />}
                        Enviar enlace
                    </Button>
                </form>

                <div className="text-muted-foreground text-center text-sm">
                    O vuelve a <TextLink href={route('login')}>iniciar sesión</TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
