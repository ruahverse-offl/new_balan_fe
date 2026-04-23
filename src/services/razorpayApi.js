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
 * Record checkout abandoned (modal dismissed) or payment.failed for a PENDING order.
 * @param {Object} body - { order_id, outcome: 'abandoned'|'failed', razorpay_payment_id?, error_description? }
 */
export const reportCheckoutOutcome = async (body) => {
  return await apiPost('/razorpay/checkout-outcome', body);
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

const DEFAULT_RAZORPAY_CHECKOUT_JS = 'https://checkout.razorpay.com/v1/checkout.js';

function resolveRazorpayCheckoutScriptUrl() {
  const fromEnv = import.meta.env.VITE_RAZORPAY_CHECKOUT_SCRIPT_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim();
  }
  return DEFAULT_RAZORPAY_CHECKOUT_JS;
}

/**
 * Load Razorpay checkout script
 * @param {string} [scriptUrl] - Optional override. When omitted, uses VITE_RAZORPAY_CHECKOUT_SCRIPT_URL or the official Razorpay CDN URL.
 * @returns {Promise<void>}
 */
export const loadRazorpayScript = (scriptUrl) => {
  const url =
    typeof scriptUrl === 'string' && scriptUrl.trim()
      ? scriptUrl.trim()
      : resolveRazorpayCheckoutScriptUrl();
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve();
        return;
      }
      reject(new Error('Razorpay Checkout script loaded but Razorpay is unavailable. Try refreshing the page.'));
    };
    script.onerror = () =>
      reject(
        new Error(
          'Could not load Razorpay Checkout. Check your connection or allow checkout.razorpay.com if an ad blocker is active.',
        ),
      );
    document.body.appendChild(script);
  });
};
