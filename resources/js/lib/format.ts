const currency = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

const dateTime = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
});

const shortDate = new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
});

export function formatCOP(amount: number): string {
    return currency.format(amount);
}

export function formatDateTime(iso: string): string {
    return dateTime.format(new Date(iso));
}

export function formatShortDate(isoDate: string): string {
    return shortDate.format(new Date(`${isoDate}T12:00:00`));
}

/**
 * "hace 5 min", "hace 2 h", "hace 3 d" — compact relative time for lists.
 */
export function formatRelative(iso: string): string {
    const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));

    if (minutes < 1) {
        return 'ahora';
    }
    if (minutes < 60) {
        return `hace ${minutes} min`;
    }
    if (minutes < 60 * 24) {
        return `hace ${Math.round(minutes / 60)} h`;
    }

    return `hace ${Math.round(minutes / (60 * 24))} d`;
}
