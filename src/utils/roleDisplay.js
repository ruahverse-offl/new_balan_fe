/**
 * Human-readable role label from a role code (fallback when API omits ``role_display_name``).
 * @param {string} [code] — e.g. ``DEV_ADMIN``, ``DELIVERY_AGENT``
 * @returns {string}
 */
export function formatRoleCodeForDisplay(code) {
  if (code == null || String(code).trim() === '') return 'User';
  const parts = String(code)
    .trim()
    .split('_')
    .filter(Boolean);
  if (!parts.length) return 'User';
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
}
