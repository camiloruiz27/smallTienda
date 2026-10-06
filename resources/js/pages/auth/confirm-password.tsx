import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import FormField from '@/components/form-field';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Confirma tu contraseña" description="Esta es una zona segura. Confirma tu contraseña para continuar.">
            <Head title="Confirmar contraseña" />

            <form onSubmit={submit} className="grid gap-5">
                <FormField
                    label="Contraseña"
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    value={data.password}
                    autoFocus
                    onChange={(event) => setData('password', event.target.value)}
                    error={errors.password}
                />

                <Button size="lg" className="w-full" disabled={processing}>
                    {processing && <LoaderCircle className="animate-spin" />}
                    Confirmar
                </Button>
            </form>
        </AuthLayout>
    );
}
