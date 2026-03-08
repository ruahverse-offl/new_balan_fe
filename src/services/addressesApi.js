/**
 * Addresses API Service
 * Handles all address-related API calls
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

/**
 * Get all addresses for the current user
 * @returns {Promise<Array>} List of addresses
 */
export const getMyAddresses = async () => {
  return await apiGet('/addresses/my-addresses');
};

/**
 * Create a new address
 * @param {Object} addressData - Address data
 * @returns {Promise<Object>} Created address
 */
export const createAddress = async (addressData) => {
  return await apiPost('/addresses', addressData);
};

/**
 * Update an address
 * @param {string} addressId - Address UUID
 * @param {Object} addressData - Updated address data
 * @returns {Promise<Object>} Updated address
 */
export const updateAddress = async (addressId, addressData) => {
  return await apiPatch(`/addresses/${addressId}`, addressData);
};

/**
 * Delete an address (soft delete)
 * @param {string} addressId - Address UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteAddress = async (addressId) => {
  return await apiDelete(`/addresses/${addressId}`);
};

/**
 * Set an address as default
 * @param {string} addressId - Address UUID
 * @returns {Promise<Object>} Updated address
 */
export const setDefaultAddress = async (addressId) => {
  return await apiPatch(`/addresses/${addressId}/default`, {});
};
