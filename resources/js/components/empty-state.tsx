import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    children?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <div className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-full">
                <Icon className="size-8" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && <p className="text-muted-foreground max-w-xs text-sm">{description}</p>}
            {children}
        </div>
    );
}
