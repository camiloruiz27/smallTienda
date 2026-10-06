import { cn } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    label?: string;
    className?: string;
    /** Slightly smaller (40px) controls for dense lists such as the cart. */
    compact?: boolean;
}

/**
 * Large +/- control sized for thumbs (44px targets, 40px when compact). The number itself is also editable for bigger quantities.
 */
export default function QuantityStepper({
    value,
    onChange,
    min = 0,
    max = 999,
    label = 'Cantidad',
    className,
    compact = false,
}: QuantityStepperProps) {
    const clamp = (next: number) => Math.min(max, Math.max(min, Number.isFinite(next) ? next : min));
    const buttonSize = compact ? 'size-10' : 'size-11';

    return (
        <div className={cn('inline-flex items-center gap-1', className)} role="group" aria-label={label}>
            <button
                type="button"
                onClick={() => onChange(clamp(value - 1))}
                disabled={value <= min}
                className={cn(
                    'bg-secondary text-secondary-foreground flex items-center justify-center rounded-full transition-transform active:scale-90 disabled:opacity-40',
                    buttonSize,
                )}
                aria-label="Quitar uno"
            >
                <Minus className="size-5" />
            </button>
            <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={value}
                onChange={(event) => onChange(clamp(parseInt(event.target.value.replace(/\D/g, ''), 10)))}
                onFocus={(event) => event.target.select()}
                className={cn('bg-transparent text-center text-lg font-semibold tabular-nums outline-hidden', compact ? 'h-10 w-9' : 'h-11 w-12')}
                aria-label={label}
            />
            <button
                type="button"
                onClick={() => onChange(clamp(value + 1))}
                disabled={value >= max}
                className={cn(
                    'bg-primary text-primary-foreground flex items-center justify-center rounded-full transition-transform active:scale-90 disabled:opacity-40',
                    buttonSize,
                )}
                aria-label="Agregar uno"
            >
                <Plus className="size-5" />
            </button>
        </div>
    );
}
