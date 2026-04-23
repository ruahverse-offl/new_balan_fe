/**
 * Shared role-checking utilities used across the application.
 * Backend role/permission/menu payloads are authoritative; this file should avoid hardcoded allowlists.
 */

/** Legacy export kept for compatibility in older imports (do not use for auth decisions). */
export const STAFF_ROLES = ['DEV_ADMIN', 'DEV', 'ADMIN', 'MANAGER', 'PHARMACIST', 'CASHIER', 'CUSTOMER_SERVICE', 'DELIVERY', 'DELIVERY_AGENT'];

/** Storefront / self-serve accounts — never staff portal, even if they have matrix rows for catalog/checkout APIs */
const NON_STAFF_ROLES = new Set(['', 'CUSTOMER', 'PUBLIC']);

export const isStaffRoleCode = (roleCode) => !NON_STAFF_ROLES.has(String(roleCode || '').toUpperCase());

/**
 * Check if a user object represents a staff member (not a customer).
 * @param {Object|null} user - The user object from AuthContext
 * @returns {boolean}
 */
export const isStaffUser = (user) => {
    const role = (user?.backendRole || user?.role || '').toUpperCase();
    if (NON_STAFF_ROLES.has(role)) return false;
    if (isStaffRoleCode(role)) return true;
    // Unknown role code: infer staff from RBAC payload (legacy / custom roles).
    if (Array.isArray(user?.menuItems) && user.menuItems.length > 0) return true;
    return false;
};

/**
 * Get the normalized uppercase role string for a user.
 * @param {Object|null} user - The user object from AuthContext
 * @returns {string}
 */
export const getUserRole = (user) => {
    return (user?.backendRole || user?.role || '').toUpperCase();
};
