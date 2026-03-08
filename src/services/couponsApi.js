/**
 * Coupons API Service
 * Handles all coupon-related API calls
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

/**
 * Get list of coupons
 * @param {Object} params - Query parameters (limit, offset, search, sort_by, sort_order, is_active)
 * @returns {Promise<Object>} List of coupons with pagination
 */
export const getCoupons = async (params = {}) => {
  const response = await apiGet('/coupons', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
    is_active: params.is_active,
  });
  
  // Map backend response to frontend format
  return {
    items: response.items || [],
    pagination: response.pagination || {},
  };
};

/**
 * Get coupon by ID
 * @param {string} couponId - Coupon UUID
 * @returns {Promise<Object>} Coupon data
 */
export const getCouponById = async (couponId) => {
  return await apiGet(`/coupons/${couponId}`);
};

/**
 * Create a new coupon
 * @param {Object} couponData - Coupon data
 * @returns {Promise<Object>} Created coupon
 */
export const createCoupon = async (couponData) => {
  return await apiPost('/coupons', couponData);
};

/**
 * Update a coupon
 * @param {string} couponId - Coupon UUID
 * @param {Object} couponData - Updated coupon data
 * @returns {Promise<Object>} Updated coupon
 */
export const updateCoupon = async (couponId, couponData) => {
  return await apiPatch(`/coupons/${couponId}`, couponData);
};

/**
 * Delete a coupon (soft delete)
 * @param {string} couponId - Coupon UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteCoupon = async (couponId) => {
  return await apiDelete(`/coupons/${couponId}`);
};

/**
 * Validate a coupon code
 * @param {string} code - Coupon code
 * @param {number} orderAmount - Order amount for validation
 * @returns {Promise<Object>} Validation result with discount
 */
export const validateCoupon = async (code, orderAmount = 0) => {
  return await apiPost('/coupons/validate', { 
    code: code.toUpperCase().trim(),
    order_amount: orderAmount 
  });
};

/**
 * Get active coupons
 * @returns {Promise<Array>} List of active coupons
 */
export const getActiveCoupons = async () => {
  const response = await getCoupons({ is_active: true, limit: 100 });
  const now = new Date();
  
  // Filter out expired coupons
  return response.items.filter(coupon => {
    if (!coupon.is_active) return false;
    if (coupon.expiry_date) {
      const expiryDate = new Date(coupon.expiry_date);
      return expiryDate > now;
    }
    return true;
  });
};
