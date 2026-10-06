import { cn } from '@/lib/utils';

interface StockBadgeProps {
    stock: number;
    minStock: number;
    className?: string;
}

/**
 * Colour is never the only signal: each state also has its own wording.
 */
export default function StockBadge({ stock, minStock, className }: StockBadgeProps) {
    const state =
        stock < 0
            ? { label: `${stock} · revisar conteo`, style: 'bg-destructive/10 text-destructive' }
            : stock === 0
              ? { label: 'Agotado', style: 'bg-destructive/10 text-destructive' }
              : stock <= minStock
                ? { label: `${stock} · bajo`, style: 'bg-warning/15 text-warning' }
                : { label: `${stock} en stock`, style: 'bg-success/10 text-success' };

    return (
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', state.style, className)}>
            {state.label}
        </span>
    );
}
