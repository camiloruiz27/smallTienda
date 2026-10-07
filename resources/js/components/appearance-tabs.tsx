import { Appearance, useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { LucideIcon, Monitor, Moon, Sun } from 'lucide-react';
import { HTMLAttributes } from 'react';

export default function AppearanceToggleTab({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: 'light', icon: Sun, label: 'Claro' },
        { value: 'dark', icon: Moon, label: 'Oscuro' },
        { value: 'system', icon: Monitor, label: 'Sistema' },
    ];

    return (
        <div className={cn('bg-muted inline-flex gap-1 rounded-xl p-1', className)} role="radiogroup" aria-label="Apariencia" {...props}>
            {tabs.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={appearance === value}
                    onClick={() => updateAppearance(value)}
                    className={cn(
                        'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition-colors',
                        appearance === value ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:bg-background/60',
                    )}
                >
                    <Icon className="size-4" />
                    {label}
                </button>
            ))}
        </div>
    );
}
