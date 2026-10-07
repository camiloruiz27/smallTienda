import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        post(route('verification.send'));
    };

    return (
        <AuthLayout title="Verifica tu correo" description="Haz clic en el enlace que te acabamos de enviar por correo para verificar tu cuenta.">
            <Head title="Verificación de correo" />

            {status === 'verification-link-sent' && (
                <div className="text-success text-center text-sm font-medium">
                    Te enviamos un nuevo enlace de verificación al correo con el que te registraste.
                </div>
            )}

            <form onSubmit={submit} className="grid gap-5 text-center">
                <Button disabled={processing} variant="secondary" size="lg">
                    {processing && <LoaderCircle className="animate-spin" />}
                    Reenviar correo de verificación
                </Button>

                <TextLink href={route('logout')} method="post" className="mx-auto block text-sm">
                    Cerrar sesión
                </TextLink>
            </form>
        </AuthLayout>
    );
}
