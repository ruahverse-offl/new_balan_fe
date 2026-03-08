/**
 * Users API Service
 * Handles user/staff management API calls
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

/**
 * Get list of users (staff/managers)
 * @param {Object} params - Query parameters (limit, offset, search, sort_by, sort_order)
 * @returns {Promise<Object>} List of users with pagination
 */
export const getUsers = async (params = {}) => {
  const response = await apiGet('/users', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
  });
  
  // Map backend response to frontend format
  return {
    items: response.items || [],
    pagination: response.pagination || {},
  };
};

/**
 * Get user by ID
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} User data
 */
export const getUserById = async (userId) => {
  return await apiGet(`/users/${userId}`);
};

/**
 * Create a new user (staff/manager)
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
export const createUser = async (userData) => {
  return await apiPost('/users', userData);
};

/**
 * Update a user
 * @param {string} userId - User UUID
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Updated user
 */
export const updateUser = async (userId, userData) => {
  return await apiPatch(`/users/${userId}`, userData);
};

/**
 * Delete a user (soft delete)
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteUser = async (userId) => {
  return await apiDelete(`/users/${userId}`);
};

/**
 * View user password - not supported by backend (passwords are hashed and not retrievable)
 * Kept as a stub to avoid breaking imports
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Error message
 */
export const viewUserPassword = async () => {
  throw new Error('Password viewing is not supported for security reasons');
};

/**
 * Get permissions for a specific user by user ID
 * Uses the auth permissions endpoint for the current user
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} User permissions
 */
export const getUserPermissionsById = async () => {
  return await apiGet('/auth/me/permissions');
};

/**
 * Get current authenticated user's profile
 * @returns {Promise<Object>} Current user data
 */
export const getCurrentUser = async () => {
  return await apiGet('/auth/me/permissions');
};

/**
 * Update current authenticated user's profile
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Updated user
 */
export const updateCurrentUser = async (userData) => {
  // Uses the user ID from the stored auth to update
  const stored = JSON.parse(localStorage.getItem('nb_auth') || '{}');
  const userId = stored.user?.id;
  if (!userId) throw new Error('Not authenticated');
  return await apiPatch(`/users/${userId}`, userData);
};