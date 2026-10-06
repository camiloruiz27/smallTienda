import { readJson, removeKey, writeJson } from '@/lib/storage';
import { uuid } from '@/lib/uuid';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface CartLine {
    productId: number;
    quantity: number;
}

interface CartState {
    lines: CartLine[];
    submissionId: string;
}

const MAX_PER_LINE = 20;

const emptyCart = (): CartState => ({ lines: [], submissionId: uuid() });

/**
 * Sets a line's quantity keeping its position in the list; a quantity of 0 removes the line.
 */
function withQuantity(lines: CartLine[], productId: number, quantity: number): CartLine[] {
    const clamped = Math.min(MAX_PER_LINE, Math.max(0, quantity));

    if (clamped === 0) {
        return lines.filter((line) => line.productId !== productId);
    }

    return lines.some((line) => line.productId === productId)
        ? lines.map((line) => (line.productId === productId ? { ...line, quantity: clamped } : line))
        : [...lines, { productId, quantity: clamped }];
}

/**
 * Per-store shopping cart kept in localStorage so a refresh or lost signal does not lose what the customer picked.
 * `submissionId` stays constant while the cart is the same purchase, which lets the server ignore duplicate submissions.
 */
export function useCart(storeToken: string) {
    const storageKey = `smalltienda:cart:${storeToken}`;
    const [state, setState] = useState<CartState>(emptyCart);

    useEffect(() => {
        const stored = readJson<CartState | null>(storageKey, null);
        if (stored && Array.isArray(stored.lines) && typeof stored.submissionId === 'string') {
            setState(stored);
        }
    }, [storageKey]);

    const update = useCallback(
        (updater: (current: CartState) => CartState) => {
            setState((current) => {
                const next = updater(current);
                writeJson(storageKey, next);

                return next;
            });
        },
        [storageKey],
    );

    const setQuantity = useCallback(
        (productId: number, quantity: number) => {
            update((current) => ({ ...current, lines: withQuantity(current.lines, productId, quantity) }));
        },
        [update],
    );

    const add = useCallback(
        (productId: number) => {
            update((current) => {
                const existing = current.lines.find((line) => line.productId === productId)?.quantity ?? 0;

                return { ...current, lines: withQuantity(current.lines, productId, existing + 1) };
            });
        },
        [update],
    );

    const clear = useCallback(() => {
        removeKey(storageKey);
        setState(emptyCart());
    }, [storageKey]);

    const quantities = useMemo(() => new Map(state.lines.map((line) => [line.productId, line.quantity])), [state.lines]);

    return {
        lines: state.lines,
        submissionId: state.submissionId,
        quantityOf: (productId: number) => quantities.get(productId) ?? 0,
        itemCount: state.lines.reduce((sum, line) => sum + line.quantity, 0),
        setQuantity,
        add,
        clear,
        maxPerLine: MAX_PER_LINE,
    };
}
