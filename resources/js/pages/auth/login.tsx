import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import FormField from '@/components/form-field';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Inicia sesión" description="Entra para administrar tu tienda">
            <Head title="Iniciar sesión" />

            {status && <div className="text-success text-center text-sm font-medium">{status}</div>}

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-5">
                    <FormField
                        label="Correo electrónico"
                        type="email"
                        required
                        autoFocus
                        autoComplete="email"
                        inputMode="email"
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        error={errors.email}
                        placeholder="tu@correo.com"
                    />

                    <div className="grid gap-1.5">
                        <FormField
                            label="Contraseña"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(event) => setData('password', event.target.value)}
                            error={errors.password}
                        />
                        {canResetPassword && (
                            <TextLink href={route('password.request')} className="ml-auto text-sm">
                                ¿Olvidaste tu contraseña?
                            </TextLink>
                        )}
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onCheckedChange={(checked) => setData('remember', checked === true)}
                        />
                        <Label htmlFor="remember">Mantener la sesión iniciada</Label>
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={processing}>
                        {processing && <LoaderCircle className="animate-spin" />}
                        Entrar
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    ¿No tienes cuenta? <TextLink href={route('register')}>Regístrate</TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
