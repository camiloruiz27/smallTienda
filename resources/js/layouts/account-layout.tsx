import FlashMessage from '@/components/flash-message';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';

interface AccountLayoutProps {
    title: string;
    description?: string;
    children: ReactNode;
}

const tabs = [
    { label: 'Perfil', routeName: 'profile.edit' },
    { label: 'Contraseña', routeName: 'password.edit' },
    { label: 'Apariencia', routeName: 'appearance' },
] as const;

/**
 * Mobile layout for the account screens (profile, password, appearance).
 */
export default function AccountLayout({ title, description, children }: AccountLayoutProps) {
    const { userStores } = usePage<SharedData>().props;
    const backHref = userStores.length === 1 ? route('store.dashboard', userStores[0].id) : route('dashboard');

    return (
        <div className="bg-background pb-safe min-h-svh">
            <Head title={title} />
            <FlashMessage />

            <header className="bg-background/90 pt-safe sticky top-0 z-30 border-b backdrop-blur">
                <div className="mx-auto flex h-14 max-w-xl items-center gap-2 px-2">
                    <Link href={backHref} className="hover:bg-accent flex size-11 items-center justify-center rounded-full" aria-label="Volver">
                        <ArrowLeft className="size-5" />
                    </Link>
                    <h1 className="text-base font-semibold">Mi cuenta</h1>
                </div>
            </header>

            <main className="mx-auto grid max-w-xl gap-6 p-4 pb-12">
                <nav className="flex gap-2 overflow-x-auto" aria-label="Secciones de la cuenta">
                    {tabs.map((tab) => {
                        const active = route().current(tab.routeName);

                        return (
                            <Link
                                key={tab.routeName}
                                href={route(tab.routeName)}
                                className={cn(
                                    'flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-medium',
                                    active ? 'bg-primary text-primary-foreground border-transparent' : 'bg-background',
                                )}
                                aria-current={active ? 'page' : undefined}
                            >
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>

                <div>
                    <h2 className="text-lg font-semibold">{title}</h2>
                    {description && <p className="text-muted-foreground text-sm">{description}</p>}
                </div>

                {children}
            </main>
        </div>
    );
}
