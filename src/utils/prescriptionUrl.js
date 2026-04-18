/**
 * Build a browser-openable URL for files stored on the API server under /storage/
 * (prescriptions, medicine images, etc.) or an absolute URL (e.g. CDN).
 *
 * Files are served by FastAPI at /storage/<category>/... (see main.py StaticFiles).
 * Legacy data may have full URLs or paths missing the /storage segment — we normalize.
 */

/**
 * If `path` is a bare filename (e.g. uuid.jpg), assume medicine uploads folder.
 */
function normalizeRelativeStorageKey(rel) {
    const r = rel.replace(/^\//, '');
    if (!r.includes('/') && /\.(jpe?g|png|gif|webp|svg)$/i.test(r)) {
        return `medicine/${r}`;
    }
    return r;
}

/**
 * Fix absolute http(s) URLs that point at /medicine/, /prescription/, /others/ but omit /storage/.
 */
function fixLegacyAbsoluteStorageUrl(urlString) {
    try {
        const u = new URL(urlString);
        const path = u.pathname;
        if (path.startsWith('/storage/')) return urlString;
        if (/^\/(medicine|prescription|others)\//.test(path)) {
            u.pathname = `/storage${path}`;
            return u.toString();
        }
    } catch {
        /* ignore */
    }
    return urlString;
}

export function getStorageFileUrl(storedPath) {
    if (!storedPath || typeof storedPath !== 'string') return '';
    const p = storedPath.trim();
    if (!p) return '';

    if (/^https?:\/\//i.test(p)) {
        return fixLegacyAbsoluteStorageUrl(p);
    }

    let base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
    if (!base && typeof window !== 'undefined') {
        base = window.location.origin;
    }
    if (!base) return '';

    const rel = normalizeRelativeStorageKey(p.replace(/^\//, ''));

    // Private GCS keys (STORAGE_BACKEND=gcs): backend redirects to a signed URL
    if (/^(medicines|prescriptions|others)\//.test(rel)) {
        return `${base}/api/v1/storage/signed?path=${encodeURIComponent(rel)}`;
    }

    if (p.startsWith('/storage/')) return `${base}${p}`;
    if (rel.startsWith('storage/')) return `${base}/${rel}`;
    return `${base}/storage/${rel}`;
}

/** @deprecated Use getStorageFileUrl — same behavior */
export const getPrescriptionFileUrl = getStorageFileUrl;
