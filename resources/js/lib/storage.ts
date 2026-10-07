/**
 * localStorage can throw or be unavailable (private mode, blocked site data), so every access is guarded
 * and the callers must keep working without it.
 */
export function readJson<T>(key: string, fallback: T): T {
    try {
        const raw = window.localStorage.getItem(key);

        return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
        return fallback;
    }
}

export function writeJson(key: string, value: unknown): void {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage is a convenience only.
    }
}

export function removeKey(key: string): void {
    try {
        window.localStorage.removeItem(key);
    } catch {
        // Storage is a convenience only.
    }
}
