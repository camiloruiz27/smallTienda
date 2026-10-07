import BottomSheet from '@/components/bottom-sheet';
import FlashMessage from '@/components/flash-message';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BarChart3,
    Boxes,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    History,
    Home,
    LogOut,
    Menu,
    Package,
    Plus,
    Receipt,
    Settings,
    Store as StoreIcon,
    Tags,
    UserCircle,
} from 'lucide-react';
import { ReactNode, useState } from 'react';

interface StoreLayoutProps {
    title: string;
    children: ReactNode;
    /** URL of the parent screen. When present a back arrow replaces the store name. */
    back?: string;
    action?: ReactNode;
    /** Hide the bottom tab bar on screens that have their own sticky action bar. */
    hideNav?: boolean;
}

export default function StoreLayout({ title, children, back, action, hideNav = false }: StoreLayoutProps) {
    const { currentStore, userStores } = usePage<SharedData>().props;
    const [moreOpen, setMoreOpen] = useState(false);
    const [storesOpen, setStoresOpen] = useState(false);

    if (!currentStore) {
        return <>{children}</>;
    }

    const tabs = [
        { label: 'Inicio', icon: Home, href: route('store.dashboard', currentStore.id), active: route().current('store.dashboard') },
        { label: 'Productos', icon: Package, href: route('store.products.index', currentStore.id), active: route().current('store.products.*') },
        {
            label: 'Inventario',
            icon: Boxes,
            href: route('store.inventory.index', currentStore.id),
            active: route().current('store.inventory.*'),
        },
        {
            label: 'Ventas',
            icon: Receipt,
            href: route('store.sales.index', currentStore.id),
            active: route().current('store.sales.*'),
            badge: currentStore.pending_sales_count,
        },
    ];

    const moreLinks = [
        { label: 'Categorías', icon: Tags, href: route('store.categories.index', currentStore.id) },
        { label: 'Movimientos de inventario', icon: History, href: route('store.inventory.movements', currentStore.id) },
        { label: 'Reportes', icon: BarChart3, href: route('store.reports', currentStore.id) },
        { label: 'Configuración y QR', icon: Settings, href: route('store.settings.edit', currentStore.id) },
    ];

    return (
        <div className="bg-background min-h-svh">
            <Head title={title} />
            <FlashMessage />

            <header className="bg-background/90 pt-safe sticky top-0 z-30 border-b backdrop-blur print:hidden">
                <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-2">
                    {back ? (
                        <Link
                            href={back}
                            className="hover:bg-accent flex size-11 items-center justify-center rounded-full"
                            aria-label="Volver"
                            prefetch
                        >
                            <ArrowLeft className="size-5" />
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={() => (userStores.length > 1 ? setStoresOpen(true) : undefined)}
                            className="hover:bg-accent flex h-11 max-w-[55%] items-center gap-2 rounded-full px-3 text-left"
                            aria-label="Tienda actual"
                        >
                            <span className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-lg">
                                <StoreIcon className="size-4" />
                            </span>
                            <span className="truncate text-sm font-semibold">{currentStore.name}</span>
                            {userStores.length > 1 && <ChevronDown className="text-muted-foreground size-4 shrink-0" />}
                        </button>
                    )}
                    <h1 className={cn('flex-1 truncate text-base font-semibold', back ? 'pl-1' : 'text-right text-sm sm:text-center')}>
                        {back || title !== currentStore.name ? title : ''}
                    </h1>
                    {action && <div className="flex shrink-0 items-center gap-1">{action}</div>}
                </div>
            </header>

            <main className={cn('mx-auto max-w-2xl', hideNav ? 'pb-8' : 'pb-28')}>{children}</main>

            {!hideNav && (
                <nav
                    className="bg-background/95 pb-safe fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur print:hidden"
                    aria-label="Navegación principal"
                >
                    <ul className="mx-auto grid max-w-2xl grid-cols-5">
                        {tabs.map(({ label, icon: Icon, href, active, badge }) => (
                            <li key={label}>
                                <Link
                                    href={href}
                                    prefetch
                                    className={cn(
                                        'relative flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
                                        active ? 'text-primary' : 'text-muted-foreground',
                                    )}
                                    aria-current={active ? 'page' : undefined}
                                >
                                    <span className="relative">
                                        <Icon className={cn('size-6', active && 'stroke-[2.5]')} />
                                        {badge ? (
                                            <span className="bg-destructive text-destructive-foreground absolute -top-1.5 -right-2.5 min-w-5 rounded-full px-1 text-center text-[11px] leading-5 font-bold">
                                                {badge > 99 ? '99+' : badge}
                                            </span>
                                        ) : null}
                                    </span>
                                    {label}
                                </Link>
                            </li>
                        ))}
                        <li>
                            <button
                                type="button"
                                onClick={() => setMoreOpen(true)}
                                className="text-muted-foreground flex h-16 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium"
                            >
                                <Menu className="size-6" />
                                Más
                            </button>
                        </li>
                    </ul>
                </nav>
            )}

            <BottomSheet open={moreOpen} onOpenChange={setMoreOpen} title="Más opciones">
                <ul className="divide-y rounded-xl border">
                    {moreLinks.map(({ label, icon: Icon, href }) => (
                        <li key={label}>
                            <Link href={href} className="hover:bg-accent flex h-14 items-center gap-3 px-4" onClick={() => setMoreOpen(false)}>
                                <Icon className="text-muted-foreground size-5" />
                                <span className="flex-1 font-medium">{label}</span>
                                <ChevronRight className="text-muted-foreground size-4" />
                            </Link>
                        </li>
                    ))}
                    <li>
                        <a
                            href={route('shop.show', currentStore.public_token)}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:bg-accent flex h-14 items-center gap-3 px-4"
                        >
                            <ExternalLink className="text-muted-foreground size-5" />
                            <span className="flex-1 font-medium">Ver tienda como cliente</span>
                        </a>
                    </li>
                </ul>

                <ul className="mt-4 divide-y rounded-xl border">
                    {userStores.length > 1 && (
                        <li>
                            <button
                                type="button"
                                className="hover:bg-accent flex h-14 w-full items-center gap-3 px-4"
                                onClick={() => (setMoreOpen(false), setStoresOpen(true))}
                            >
                                <StoreIcon className="text-muted-foreground size-5" />
                                <span className="flex-1 text-left font-medium">Cambiar de tienda</span>
                            </button>
                        </li>
                    )}
                    <li>
                        <Link href={route('profile.edit')} className="hover:bg-accent flex h-14 items-center gap-3 px-4">
                            <UserCircle className="text-muted-foreground size-5" />
                            <span className="flex-1 font-medium">Mi cuenta</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            method="post"
                            href={route('logout')}
                            as="button"
                            className="hover:bg-accent text-destructive flex h-14 w-full items-center gap-3 px-4"
                        >
                            <LogOut className="size-5" />
                            <span className="flex-1 text-left font-medium">Cerrar sesión</span>
                        </Link>
                    </li>
                </ul>
            </BottomSheet>

            <BottomSheet open={storesOpen} onOpenChange={setStoresOpen} title="Tus tiendas">
                <ul className="divide-y rounded-xl border">
                    {userStores.map((store) => (
                        <li key={store.id}>
                            <Link
                                href={route('store.dashboard', store.id)}
                                className={cn('hover:bg-accent flex h-14 items-center gap-3 px-4', store.id === currentStore.id && 'bg-accent')}
                                onClick={() => setStoresOpen(false)}
                            >
                                <StoreIcon className="text-muted-foreground size-5" />
                                <span className="flex-1 font-medium">{store.name}</span>
                            </Link>
                        </li>
                    ))}
                    <li>
                        <Link href={route('stores.create')} className="text-primary hover:bg-accent flex h-14 items-center gap-3 px-4 font-medium">
                            <Plus className="size-5" /> Crear otra tienda
                        </Link>
                    </li>
                </ul>
            </BottomSheet>
        </div>
    );
}
