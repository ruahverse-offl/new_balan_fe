/**
 * Build a browser-openable URL for files stored on the API server under /storage/
 * (prescriptions, medicine images, etc.) or an absolute URL (e.g. CDN).
 */
export function getStorageFileUrl(storedPath) {
    if (!storedPath || typeof storedPath !== 'string') return '';
    const p = storedPath.trim();
    if (!p) return '';
    if (/^https?:\/\//i.test(p)) return p;

    let base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
    if (!base && typeof window !== 'undefined') {
        base = window.location.origin;
    }
    if (!base) return '';

    if (p.startsWith('/storage/')) return `${base}${p}`;
    const rel = p.replace(/^\//, '');
    if (rel.startsWith('storage/')) return `${base}/${rel}`;
    return `${base}/storage/${rel}`;
}

/** @deprecated Use getStorageFileUrl — same behavior */
export const getPrescriptionFileUrl = getStorageFileUrl;
