/**
 * Time range formatters: admin = 24h, website = 12h AM/PM.
 * Handles strings like "10:00 AM - 1:00 PM" or "10:00 - 13:00".
 */

/**
 * Parse a single time string to 24h HH:mm.
 * Accepts "10:00 AM", "1:00 PM", "10:00", "13:00".
 * @param {string} t
 * @returns {string} HH:mm or ''
 */
export function parseTimeToHHmm(t) {
  if (!t || typeof t !== 'string') return '';
  const s = t.trim();
  if (!s) return '';
  // Already HH:mm or HH:mm:ss
  if (/^\d{1,2}:\d{2}(:\d{2})?\.?\d*$/.test(s)) {
    const [h, m] = s.split(':');
    return `${String(parseInt(h, 10)).padStart(2, '0')}:${String(m || '00').padStart(2, '0')}`.slice(0, 5);
  }
  const match = s.match(/^\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\s*$/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2] || '00';
    if (match[4].toUpperCase() === 'PM' && h !== 12) h += 12;
    if (match[4].toUpperCase() === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  return '';
}

/**
 * Format a single 24h HH:mm to 12h (e.g. "13:00" -> "1:00 PM").
 * @param {string} time24
 * @returns {string}
 */
export function formatTimeTo12h(time24) {
  if (!time24) return '';
  const [hours, minutes] = String(time24).split(':');
  let h = parseInt(hours, 10);
  if (Number.isNaN(h)) return '';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${(minutes || '00').padStart(2, '0')} ${ampm}`;
}

/**
 * Format a time range for admin (24h). e.g. "10:00 AM - 1:00 PM" -> "10:00 - 13:00"
 * @param {string} rangeStr
 * @returns {string}
 */
export function formatTimeRangeTo24h(rangeStr) {
  if (!rangeStr || typeof rangeStr !== 'string') return '';
  const parts = rangeStr.split(/\s*-\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return rangeStr.trim() || '';
  const start = parseTimeToHHmm(parts[0]);
  const end = parseTimeToHHmm(parts[1]);
  if (!start || !end) return rangeStr.trim();
  return `${start} - ${end}`;
}

/**
 * Format a single time for admin (24h). e.g. "10:00 AM" -> "10:00", "13:00" -> "13:00"
 * @param {string} t
 * @returns {string}
 */
export function formatSingleTimeTo24h(t) {
  return parseTimeToHHmm(t) || (t && String(t).trim()) || '';
}

/**
 * Format a time range for website (12h AM/PM). e.g. "10:00 - 13:00" -> "10:00 AM - 1:00 PM"
 * @param {string} rangeStr
 * @returns {string}
 */
export function formatTimeRangeTo12h(rangeStr) {
  if (!rangeStr || typeof rangeStr !== 'string') return '';
  const parts = rangeStr.split(/\s*-\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return rangeStr.trim() || '';
  const start24 = parseTimeToHHmm(parts[0]);
  const end24 = parseTimeToHHmm(parts[1]);
  if (!start24 || !end24) return rangeStr.trim();
  return `${formatTimeTo12h(start24)} - ${formatTimeTo12h(end24)}`;
}
