import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Snackbar for the `flash.success` / `flash.error` messages sent by the server after an action.
 */
export default function FlashMessage() {
    const { flash } = usePage<SharedData>().props;
    const message = flash?.error ?? flash?.success ?? null;
    const isError = Boolean(flash?.error);
    const [visibleMessage, setVisibleMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!message) {
            return;
        }

        setVisibleMessage(message);
        const timeout = window.setTimeout(() => setVisibleMessage(null), 4000);

        return () => window.clearTimeout(timeout);
    }, [message, flash]);

    if (!visibleMessage) {
        return null;
    }

    const Icon = isError ? AlertCircle : CheckCircle2;

    return (
        <div className="pt-safe pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-3" role="status" aria-live="polite">
            <div
                className={cn(
                    'animate-in slide-in-from-top-4 fade-in pointer-events-auto flex max-w-md items-center gap-2 rounded-full px-4 py-3 text-sm font-medium shadow-lg',
                    isError ? 'bg-destructive text-destructive-foreground' : 'bg-foreground text-background',
                )}
            >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span>{visibleMessage}</span>
            </div>
        </div>
    );
}
