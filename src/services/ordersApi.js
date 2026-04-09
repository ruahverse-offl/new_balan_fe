/**
 * Orders API Service
 * Handles all order-related API calls
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

/**
 * Get list of orders
 * @param {Object} params - Query parameters (limit, offset, search, sort_by, sort_order)
 * @returns {Promise<Object>} List of orders with pagination
 */
export const getOrders = async (params = {}) => {
  const response = await apiGet('/orders/', {
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
 * Get order by ID
 * @param {string} orderId - Order UUID
 * @returns {Promise<Object>} Order data
 */
export const getOrderById = async (orderId) => {
  return await apiGet(`/orders/${orderId}`);
};

/**
 * Get full order detail (order + items + payment) for admin/refund reference
 * @param {string} orderId - Order UUID
 * @returns {Promise<{ order: Object, items: Array, payment: Object|null }>}
 */
export const getOrderDetail = async (orderId) => {
  return await apiGet(`/orders/${orderId}/detail`);
};

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Created order
 */
export const createOrder = async (orderData) => {
  return await apiPost('/orders/', orderData);
};

/**
 * Update an order
 * @param {string} orderId - Order UUID
 * @param {Object} orderData - Updated order data
 * @returns {Promise<Object>} Updated order
 */
export const updateOrder = async (orderId, orderData) => {
  return await apiPatch(`/orders/${orderId}`, orderData);
};

/**
 * Delete an order (soft delete)
 * @param {string} orderId - Order UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteOrder = async (orderId) => {
  return await apiDelete(`/orders/${orderId}`);
};
