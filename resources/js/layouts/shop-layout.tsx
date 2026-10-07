import FlashMessage from '@/components/flash-message';
import { Head, Link } from '@inertiajs/react';
import { Store as StoreIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface ShopLayoutProps {
    storeName: string;
    storeToken: string;
    title?: string;
    children: ReactNode;
    /** Content pinned above the header, e.g. the search field. */
    sticky?: ReactNode;
}

/**
 * Layout for the customer-facing pages. It never shows account or admin controls.
 */
export default function ShopLayout({ storeName, storeToken, title, children, sticky }: ShopLayoutProps) {
    return (
        <div className="bg-muted/40 min-h-svh">
            <Head title={title ? `${title} · ${storeName}` : storeName} />
            <FlashMessage />

            <header className="bg-background pt-safe sticky top-0 z-30 border-b">
                <div className="mx-auto max-w-lg">
                    <Link href={route('shop.show', storeToken)} className="flex h-14 items-center gap-3 px-4">
                        <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl">
                            <StoreIcon className="size-5" />
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate text-base leading-tight font-semibold">{storeName}</span>
                            <span className="text-muted-foreground block text-xs">Autoservicio</span>
                        </span>
                    </Link>
                    {sticky && <div className="px-4 pb-3">{sticky}</div>}
                </div>
            </header>

            <main className="mx-auto max-w-lg">{children}</main>
        </div>
    );
}
