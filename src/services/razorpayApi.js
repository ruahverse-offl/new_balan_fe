/**
 * Razorpay Payment API Service
 * Handles payment initiation, verification, status check, and refunds.
 */

import { apiPost, apiGet } from '../utils/apiClient';

/**
 * Initiate Razorpay payment (creates order + Razorpay order)
 * @param {Object} orderData - Order details (items, address, amounts)
 * @returns {Promise<Object>} { order_id, razorpay_order_id, key_id, amount }
 */
export const initiatePayment = async (orderData) => {
  return await apiPost('/razorpay/initiate', orderData);
};

/**
 * Mock: create order without Razorpay (for demo). Returns order_id for mock-complete.
 * @param {Object} orderData - Same as initiatePayment
 * @returns {Promise<Object>} { order_id, order_reference, amount }
 */
export const mockInitiatePayment = async (orderData) => {
  return await apiPost('/razorpay/mock-initiate', orderData);
};

/**
 * Mock: mark order as paid (no real payment). Call after user clicks Proceed on mock screen.
 * @param {string} orderId - Order UUID from mock-initiate
 * @returns {Promise<Object>} { order_id, payment_status, amount, transaction_id, order_status }
 */
export const mockCompletePayment = async (orderId) => {
  return await apiPost('/razorpay/mock-complete', { order_id: orderId });
};

/**
 * Verify payment after Razorpay checkout success
 * @param {Object} data - { razorpay_payment_id, razorpay_order_id, razorpay_signature }
 * @returns {Promise<Object>} { order_id, payment_status, amount, transaction_id, order_status }
 */
export const verifyPayment = async (data) => {
  return await apiPost('/razorpay/verify', data);
};

/**
 * Check payment status (for callback page / polling)
 * @param {string} orderId - Our order UUID
 * @returns {Promise<Object>} { order_id, payment_status, amount, transaction_id, order_status }
 */
export const checkPaymentStatus = async (orderId) => {
  return await apiGet(`/razorpay/status/${orderId}`);
};

/**
 * Initiate a refund for a paid order (admin only)
 * @param {string} orderId - Our order UUID
 * @param {Object} data - { amount?: number, reason?: string }
 * @returns {Promise<Object>} { order_id, refund_status, refund_amount, refund_transaction_id }
 */
export const refundPayment = async (orderId, data = {}) => {
  return await apiPost(`/razorpay/refund/${orderId}`, data);
};

/**
 * Load Razorpay checkout script
 * @param {string} scriptUrl - Optional. Default: https://checkout.razorpay.com/v1/checkout.js
 * @returns {Promise<void>}
 */
export const loadRazorpayScript = (scriptUrl = 'https://checkout.razorpay.com/v1/checkout.js') => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
};
