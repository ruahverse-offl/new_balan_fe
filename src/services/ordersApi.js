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
  const query = {
    limit: params.limit || 20,
    offset: params.offset || 0,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
  };
  if (params.search) query.search = params.search;
  if (params.order_status) query.order_status = params.order_status;
  if (params.order_date) query.order_date = params.order_date;
  if (params.staff_scope) query.staff_scope = params.staff_scope;

  const response = await apiGet('/orders', query);
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
 * Get aggregated sales summary (delivered / returned / cancelled / net)
 * @returns {Promise<{ delivered_amount, returned_amount, cancelled_amount, refunded_amount, net_sales }>}
 */
export const getOrdersSalesSummary = async () => {
  return await apiGet('/orders/stats');
};

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Created order
 */
export const createOrder = async (orderData) => {
  return await apiPost('/orders', orderData);
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

/**
 * Customer self-cancellation. Allowed before parcel is packed (ORDER_RECEIVED → DELIVERY_ASSIGNED).
 * @param {string} orderId - Order UUID
 * @param {string} [reason] - Optional cancellation reason
 * @returns {Promise<{ order_id, order_status, refund_initiated, refund_status, message }>}
 */
export const cancelOrderAsCustomer = async (orderId, reason) => {
  return await apiPost(`/orders/${orderId}/cancel`, {
    cancellation_reason: reason || null,
  });
};
