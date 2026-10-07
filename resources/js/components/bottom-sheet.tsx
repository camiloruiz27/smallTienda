import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BottomSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
}

/**
 * Mobile-first replacement for modals: slides up from the bottom, scrolls internally and respects the iPhone safe area.
 */
export default function BottomSheet({ open, onOpenChange, title, description, children, className }: BottomSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className={cn('pb-safe max-h-[92svh] overflow-y-auto rounded-t-2xl px-4 pt-5 pb-6', className)}>
                <div className="bg-muted-foreground/30 mx-auto mb-3 h-1.5 w-10 rounded-full" aria-hidden />
                <SheetHeader className="mb-4 text-left">
                    <SheetTitle>{title}</SheetTitle>
                    <SheetDescription className={description ? undefined : 'sr-only'}>{description ?? title}</SheetDescription>
                </SheetHeader>
                {children}
            </SheetContent>
        </Sheet>
    );
}
