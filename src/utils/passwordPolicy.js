/**
 * Customer / staff password rules (aligned with backend).
 */

export const PASSWORD_POLICY_HINT =
    'Use at least 8 characters with one uppercase letter, one lowercase letter, and one special character.';

const PASSWORD_POLICY_MESSAGE =
    'Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, and one special character.';

/**
 * Returns an error message if the password does not meet policy, otherwise null.
 *
 * @param {string} [password]
 * @returns {string | null}
 */
export function getPasswordPolicyError(password) {
    const s = String(password ?? '').trim();
    if (s.length < 8 || !/[A-Z]/.test(s) || !/[a-z]/.test(s) || !/[^A-Za-z0-9]/.test(s)) {
        return PASSWORD_POLICY_MESSAGE;
    }
    return null;
}
