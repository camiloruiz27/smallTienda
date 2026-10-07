import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import FormField from '@/components/form-field';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';

interface ResetPasswordProps {
    token: string;
    email: string;
}

type ResetPasswordForm = {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { data, setData, post, processing, errors, reset } = useForm<ResetPasswordForm>({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Nueva contraseña" description="Escribe la contraseña nueva para tu cuenta">
            <Head title="Restablecer contraseña" />

            <form onSubmit={submit} className="grid gap-5">
                <FormField
                    label="Correo electrónico"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={data.email}
                    readOnly
                    error={errors.email}
                />
                <FormField
                    label="Contraseña nueva"
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    value={data.password}
                    autoFocus
                    onChange={(event) => setData('password', event.target.value)}
                    error={errors.password}
                />
                <FormField
                    label="Confirmar contraseña"
                    type="password"
                    name="password_confirmation"
                    autoComplete="new-password"
                    value={data.password_confirmation}
                    onChange={(event) => setData('password_confirmation', event.target.value)}
                    error={errors.password_confirmation}
                />

                <Button type="submit" size="lg" className="w-full" disabled={processing}>
                    {processing && <LoaderCircle className="animate-spin" />}
                    Restablecer contraseña
                </Button>
            </form>
        </AuthLayout>
    );
}
