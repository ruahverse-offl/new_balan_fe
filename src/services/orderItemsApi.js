/**
 * Order Items API Service
 * Handles fetching order items (line items within an order)
 */

import { apiGet } from '../utils/apiClient';

/**
 * Get list of order items, optionally filtered by order_id
 * @param {Object} params - { limit, offset, search, sort_by, sort_order, order_id }
 * @returns {Promise<Object>} { items: OrderItem[], pagination: {} }
 */
export const getOrderItems = async (params = {}) => {
  const response = await apiGet('/order-items', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
    order_id: params.order_id,
  });
  return { items: response.items || [], pagination: response.pagination || {} };
};

/**
 * Get order item by ID
 * @param {string} itemId - Order item UUID
 * @returns {Promise<Object>} Order item data
 */
export const getOrderItemById = async (itemId) => {
  return await apiGet(`/order-items/${itemId}`);
};
