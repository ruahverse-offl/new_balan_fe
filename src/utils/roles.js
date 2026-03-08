/**
 * Shared role-checking utilities used across the application.
 * Single source of truth for staff role definitions.
 */

export const STAFF_ROLES = ['DEV_ADMIN', 'ADMIN', 'MANAGER', 'PHARMACIST', 'CASHIER', 'CUSTOMER_SERVICE'];

/**
 * Check if a user object represents a staff member (not a customer).
 * @param {Object|null} user - The user object from AuthContext
 * @returns {boolean}
 */
export const isStaffUser = (user) => {
    const role = (user?.backendRole || user?.role || '').toUpperCase();
    return STAFF_ROLES.includes(role);
};

/**
 * Get the normalized uppercase role string for a user.
 * @param {Object|null} user - The user object from AuthContext
 * @returns {string}
 */
export const getUserRole = (user) => {
    return (user?.backendRole || user?.role || '').toUpperCase();
};
