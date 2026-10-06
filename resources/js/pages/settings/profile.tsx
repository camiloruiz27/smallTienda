import { type SharedData } from '@/types';
import { Link, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import DeleteUser from '@/components/delete-user';
import FormField from '@/components/form-field';
import { Button } from '@/components/ui/button';
import AccountLayout from '@/layouts/account-layout';

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;

    const { data, setData, patch, errors, processing } = useForm({
        name: auth.user.name,
        email: auth.user.email,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        patch(route('profile.update'), { preserveScroll: true });
    };

    return (
        <AccountLayout title="Perfil" description="Actualiza tu nombre y tu correo electrónico">
            <form onSubmit={submit} className="grid gap-5">
                <FormField
                    label="Nombre"
                    value={data.name}
                    onChange={(event) => setData('name', event.target.value)}
                    error={errors.name}
                    required
                    autoComplete="name"
                />
                <FormField
                    label="Correo electrónico"
                    type="email"
                    value={data.email}
                    onChange={(event) => setData('email', event.target.value)}
                    error={errors.email}
                    required
                    autoComplete="username"
                />

                {mustVerifyEmail && auth.user.email_verified_at === null && (
                    <div className="text-sm">
                        <p>
                            Tu correo no está verificado.{' '}
                            <Link href={route('verification.send')} method="post" as="button" className="text-primary underline">
                                Reenviar correo de verificación
                            </Link>
                        </p>
                        {status === 'verification-link-sent' && (
                            <p className="text-success mt-2 font-medium">Te enviamos un nuevo enlace de verificación.</p>
                        )}
                    </div>
                )}

                <Button type="submit" size="lg" disabled={processing}>
                    {processing && <LoaderCircle className="animate-spin" />}
                    Guardar cambios
                </Button>
            </form>

            <DeleteUser />
        </AccountLayout>
    );
}
