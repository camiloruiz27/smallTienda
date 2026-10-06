import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import FormField from '@/components/form-field';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Crea tu cuenta" description="Después podrás crear tu tienda y su código QR">
            <Head title="Registro" />
            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-5">
                    <FormField
                        label="Nombre"
                        required
                        autoFocus
                        autoComplete="name"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        disabled={processing}
                        error={errors.name}
                        placeholder="Tu nombre"
                    />
                    <FormField
                        label="Correo electrónico"
                        type="email"
                        required
                        autoComplete="email"
                        inputMode="email"
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        disabled={processing}
                        error={errors.email}
                        placeholder="tu@correo.com"
                    />
                    <FormField
                        label="Contraseña"
                        type="password"
                        required
                        autoComplete="new-password"
                        value={data.password}
                        onChange={(event) => setData('password', event.target.value)}
                        disabled={processing}
                        error={errors.password}
                        hint="Mínimo 8 caracteres"
                    />
                    <FormField
                        label="Confirmar contraseña"
                        type="password"
                        required
                        autoComplete="new-password"
                        value={data.password_confirmation}
                        onChange={(event) => setData('password_confirmation', event.target.value)}
                        disabled={processing}
                        error={errors.password_confirmation}
                    />

                    <Button type="submit" size="lg" className="w-full" disabled={processing}>
                        {processing && <LoaderCircle className="animate-spin" />}
                        Crear cuenta
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    ¿Ya tienes cuenta? <TextLink href={route('login')}>Inicia sesión</TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
