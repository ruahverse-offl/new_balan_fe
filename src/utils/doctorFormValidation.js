/**
 * Client-side validation for Manage Doctors modal (before API).
 */

/** Strip to 10-digit Indian mobile when possible; returns '' if input empty. */
export function normalizeDoctorPhone(raw) {
    if (raw == null || String(raw).trim() === '') return '';
    let s = String(raw).replace(/[\s-]/g, '');
    if (s.startsWith('+91')) s = s.slice(3);
    if (s.startsWith('91') && s.length === 12) s = s.slice(2);
    if (s.startsWith('0') && s.length === 11) s = s.slice(1);
    return s;
}

/** Empty phone is allowed. Otherwise require 10-digit Indian mobile (starts 6–9). */
export function isValidDoctorPhone(raw) {
    if (raw == null || String(raw).trim() === '') return true;
    const d = normalizeDoctorPhone(raw);
    return /^[6-9]\d{9}$/.test(d);
}

function hhmmToMinutes(hhmm) {
    if (!hhmm || typeof hhmm !== 'string') return null;
    const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (Number.isNaN(h) || Number.isNaN(min) || h > 23 || min > 59) return null;
    return h * 60 + min;
}

/**
 * @param {string} start
 * @param {string} end
 * @param {string} label e.g. "Morning slot"
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validateTimePair(start, end, label) {
    const a = (start || '').trim();
    const b = (end || '').trim();
    if (!a && !b) return { ok: true };
    if (!a || !b) {
        return {
            ok: false,
            message: `${label}: enter both start and end, or leave both empty.`,
        };
    }
    const ma = hhmmToMinutes(a);
    const mb = hhmmToMinutes(b);
    if (ma == null || mb == null) {
        return { ok: false, message: `${label}: use a valid time for start and end.` };
    }
    if (mb <= ma) {
        return { ok: false, message: `${label}: end time must be after start time.` };
    }
    return { ok: true };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Non-empty email must look like an email (browser also checks type="email"). */
export function isValidDoctorEmail(raw) {
    if (raw == null || String(raw).trim() === '') return true;
    const s = String(raw).trim();
    return s.length <= 254 && EMAIL_RE.test(s);
}

/**
 * @param {object} form — doctor modal state
 * @returns {{ ok: true, phoneNormalized: string } | { ok: false, message: string }}
 */
export function validateDoctorForm(form) {
    if (!form.name || !String(form.name).trim()) {
        return { ok: false, message: 'Doctor name is required.' };
    }
    if (!form.specialty || !String(form.specialty).trim()) {
        return { ok: false, message: 'Specialization is required.' };
    }
    if (!form.bio || !String(form.bio).trim()) {
        return { ok: false, message: 'About / biography is required.' };
    }

    if (!isValidDoctorPhone(form.phone)) {
        return {
            ok: false,
            message: 'Phone must be a valid 10-digit Indian mobile (6–9…), or leave empty.',
        };
    }

    if (!isValidDoctorEmail(form.email)) {
        return { ok: false, message: 'Enter a valid email address, or leave empty.' };
    }

    const img = form.image != null ? String(form.image).trim() : '';
    if (img) {
        try {
            const u = new URL(img);
            if (u.protocol !== 'http:' && u.protocol !== 'https:') {
                return { ok: false, message: 'Photo URL must start with http:// or https://.' };
            }
        } catch {
            return { ok: false, message: 'Photo URL must be a valid http(s) URL, or leave empty.' };
        }
    }

    const fee = form.consultationFee;
    if (fee !== '' && fee != null && String(fee).trim() !== '') {
        const n = Number(fee);
        if (Number.isNaN(n) || n < 0) {
            return { ok: false, message: 'Consultation fee must be a number ≥ 0.' };
        }
    }

    let r = validateTimePair(form.morningStart, form.morningEnd, 'Morning slot');
    if (!r.ok) return r;
    r = validateTimePair(form.eveningStart, form.eveningEnd, 'Evening slot');
    if (!r.ok) return r;

    return { ok: true, phoneNormalized: normalizeDoctorPhone(form.phone) };
}
