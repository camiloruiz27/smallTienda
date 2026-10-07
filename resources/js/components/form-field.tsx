import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ComponentProps, ReactNode, useId } from 'react';

interface FormFieldProps extends Omit<ComponentProps<typeof Input>, 'id'> {
    label: string;
    error?: string;
    hint?: ReactNode;
}

/**
 * Label + input + hint + error with the right aria wiring, so every form on the phone looks and behaves the same.
 */
export default function FormField({ label, error, hint, ...inputProps }: FormFieldProps) {
    const id = useId();

    return (
        <div className="grid gap-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...inputProps} />
            {hint && !error && (
                <p id={`${id}-hint`} className="text-muted-foreground text-xs">
                    {hint}
                </p>
            )}
            <InputError id={`${id}-error`} message={error} />
        </div>
    );
}
