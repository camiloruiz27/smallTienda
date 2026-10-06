import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

import BottomSheet from '@/components/bottom-sheet';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({ password: '' });

    const closeModal = () => {
        setOpen(false);
        clearErrors();
        reset();
    };

    const deleteUser: FormEventHandler = (event) => {
        event.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    return (
        <section className="grid gap-4 border-t pt-6">
            <HeadingSmall title="Eliminar cuenta" description="Borra tu cuenta de forma permanente" />
            <div className="bg-destructive/10 grid gap-3 rounded-2xl p-4">
                <p className="text-destructive text-sm">Esta acción no se puede deshacer. Antes debes eliminar o dejar sin dueño tus tiendas.</p>
                <Button variant="destructive" onClick={() => setOpen(true)}>
                    Eliminar mi cuenta
                </Button>
            </div>

            <BottomSheet
                open={open}
                onOpenChange={(isOpen) => (isOpen ? setOpen(true) : closeModal())}
                title="¿Seguro que quieres eliminar tu cuenta?"
                description="Escribe tu contraseña para confirmar."
            >
                <form className="grid gap-4" onSubmit={deleteUser}>
                    <div className="grid gap-1.5">
                        <Label htmlFor="delete-password" className="sr-only">
                            Contraseña
                        </Label>
                        <Input
                            id="delete-password"
                            type="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(event) => setData('password', event.target.value)}
                            placeholder="Contraseña"
                            autoComplete="current-password"
                        />
                        <InputError message={errors.password} />
                    </div>
                    <Button type="submit" variant="destructive" size="lg" disabled={processing}>
                        Eliminar cuenta
                    </Button>
                    <Button type="button" variant="outline" size="lg" onClick={closeModal}>
                        Cancelar
                    </Button>
                </form>
            </BottomSheet>
        </section>
    );
}
