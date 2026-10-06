import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';

interface ProductThumbProps {
    src: string | null;
    name: string;
    className?: string;
}

export default function ProductThumb({ src, name, className }: ProductThumbProps) {
    return (
        <div className={cn('bg-muted text-muted-foreground flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg', className)}>
            {src ? <img src={src} alt={name} loading="lazy" className="size-full object-cover" /> : <Package className="size-1/2" aria-hidden />}
        </div>
    );
}
