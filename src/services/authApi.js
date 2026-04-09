/**
 * Authentication API Service
 * Handles all authentication-related API calls to the backend
 */

import { buildApiUrl } from '../config/api';

/**
 * Login user with email and password
 * @param {string} email - User email address
 * @param {string} password - User password
 * @returns {Promise<Object>} Auth response with token, refresh_token, and user info
 * @throws {Error} If login fails
 */
export const login = async (email, password) => {
  try {
    const response = await fetch(buildApiUrl('/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle error response from backend
      const errorMessage = data.detail || data.message || 'Login failed';
      throw new Error(errorMessage);
    }

    return {
      token: data.token,
      refresh_token: data.refresh_token,
      token_type: data.token_type || 'bearer',
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.full_name,
        role_id: data.user.role_id,
        mobile_number: data.user.mobile_number ?? null,
        // Map to frontend expected format
        name: data.user.full_name,
        role: 'customer', // Will be determined by role_id later
      },
    };
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.full_name - User full name
 * @param {string} userData.email - User email address
 * @param {string} userData.password - User password
 * @param {string} userData.mobile_number - User mobile number
 * Backend always assigns the CUSTOMER role; only customer permissions are granted on signup.
 * @returns {Promise<Object>} Auth response with token, refresh_token, and user info
 * @throws {Error} If registration fails
 */
export const register = async (userData) => {
  try {
    const response = await fetch(buildApiUrl('/auth/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: userData.full_name,
        mobile_number: userData.mobile_number || userData.phone,
        email: userData.email,
        password: userData.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle error response from backend
      const errorMessage = data.detail || data.message || 'Registration failed';
      throw new Error(errorMessage);
    }

    return {
      token: data.token,
      refresh_token: data.refresh_token,
      token_type: data.token_type || 'bearer',
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.full_name,
        role_id: data.user.role_id,
        mobile_number: data.user.mobile_number ?? null,
        // Map to frontend expected format
        name: data.user.full_name,
        role: 'customer', // Will be determined by role_id later
      },
    };
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New tokens
 * @throws {Error} If refresh fails
 */
export const refreshToken = async (refreshToken) => {
  try {
    const response = await fetch(buildApiUrl('/auth/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.detail || data.message || 'Token refresh failed';
      throw new Error(errorMessage);
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type || 'bearer',
      expires_in: data.expires_in,
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
};

/**
 * Get CUSTOMER role ID for registration
 * This is a helper function to fetch the CUSTOMER role ID
 * @returns {Promise<string>} CUSTOMER role UUID
 * @throws {Error} If role not found
 */
export const getCustomerRoleId = async () => {
  try {
    const response = await fetch(buildApiUrl('/auth/customer-role-id'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error('Failed to fetch customer role');
    }

    if (!data.role_id) {
      throw new Error('CUSTOMER role not found. Please contact administrator.');
    }

    return data.role_id;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
};

/**
 * Get current user's permissions
 * Fetches all permissions for the currently authenticated user
 * @param {string} [token] - Optional token to use. If not provided, reads from localStorage
 * @returns {Promise<Array<string>>} Array of permission codes
 * @throws {Error} If fetch fails
 */
export const getUserPermissions = async (token = null) => {
  try {
    // Use provided token or get from localStorage
    let authToken = token;
    if (!authToken) {
      const storedAuth = JSON.parse(localStorage.getItem('nb_auth') || '{}');
      authToken = storedAuth.token;
    }
    
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(buildApiUrl('/auth/me/permissions'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Failed to fetch permissions');
    }

    return {
      permissions: data.permissions || [],
      role_code: data.role_code || null,
      menu_items: data.menu_items || [],
      menu_keys: data.menu_keys || [],
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
};

/**
 * Logout - blacklist the current token on the backend
 */
export const logoutApi = async () => {
  try {
    const storedAuth = JSON.parse(localStorage.getItem('nb_auth') || '{}');
    const authToken = storedAuth.token;
    if (!authToken) return;

    await fetch(buildApiUrl('/auth/logout'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });
  } catch {
    // Logout is best-effort; always clear local storage
  }
};

/**
 * Change password for current user
 * @param {string} currentPassword
 * @param {string} newPassword
 */
export const changePassword = async (currentPassword, newPassword) => {
  const storedAuth = JSON.parse(localStorage.getItem('nb_auth') || '{}');
  const authToken = storedAuth.token;
  if (!authToken) throw new Error('Not authenticated');

  const response = await fetch(buildApiUrl('/auth/change-password'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Password change failed');
  }
  return data;
};
