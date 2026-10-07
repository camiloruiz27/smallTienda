import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useRef } from 'react';

import FormField from '@/components/form-field';
import { Button } from '@/components/ui/button';
import AccountLayout from '@/layouts/account-layout';

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (event) => {
        event.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <AccountLayout title="Contraseña" description="Usa una contraseña larga y difícil de adivinar">
            <form onSubmit={updatePassword} className="grid gap-5">
                <FormField
                    ref={currentPasswordInput}
                    label="Contraseña actual"
                    type="password"
                    value={data.current_password}
                    onChange={(event) => setData('current_password', event.target.value)}
                    error={errors.current_password}
                    autoComplete="current-password"
                />
                <FormField
                    ref={passwordInput}
                    label="Contraseña nueva"
                    type="password"
                    value={data.password}
                    onChange={(event) => setData('password', event.target.value)}
                    error={errors.password}
                    autoComplete="new-password"
                />
                <FormField
                    label="Confirmar contraseña nueva"
                    type="password"
                    value={data.password_confirmation}
                    onChange={(event) => setData('password_confirmation', event.target.value)}
                    error={errors.password_confirmation}
                    autoComplete="new-password"
                />

                <Button type="submit" size="lg" disabled={processing}>
                    {processing && <LoaderCircle className="animate-spin" />}
                    Guardar contraseña
                </Button>
            </form>
        </AccountLayout>
    );
}
