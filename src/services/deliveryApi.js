/**
 * Delivery Settings API Service
 * Handles delivery settings and slots API calls
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

/**
 * Get delivery settings (singleton)
 * @returns {Promise<Object>} Delivery settings
 */
export const getDeliverySettings = async () => {
  try {
    return await apiGet('/delivery-settings/');
  } catch (error) {
    // If settings don't exist, return default
    if (error.message.includes('not found')) {
      return {
        is_enabled: true,
        show_marquee: true,
        slots: [],
      };
    }
    throw error;
  }
};

/**
 * Create or update delivery settings
 * @param {Object} settingsData - Delivery settings data
 * @returns {Promise<Object>} Updated delivery settings
 */
export const updateDeliverySettings = async (settingsData) => {
  const { slots, ...rest } = settingsData;
  const num = (v, def) => (v != null && v !== '' ? Number(v) : def);
  // Only include fields that were explicitly provided, so partial updates (e.g. only show_marquee from Coupons tab) don't overwrite other delivery settings
  const payload = {};
  if (rest.min_order_amount != null) payload.min_order_amount = num(rest.min_order_amount, 0);
  if (rest.delivery_fee != null) payload.delivery_fee = num(rest.delivery_fee, 40);
  if (rest.free_delivery_threshold != null) payload.free_delivery_threshold = num(rest.free_delivery_threshold, 500);
  if (rest.is_enabled !== undefined) payload.is_enabled = Boolean(rest.is_enabled);
  if (rest.show_marquee !== undefined) payload.show_marquee = Boolean(rest.show_marquee);
  if (rest.delivery_zones != null) payload.delivery_zones = rest.delivery_zones;
  try {
    return await apiPatch('/delivery-settings/', payload);
  } catch (error) {
    const msg = error?.message || '';
    if (msg.includes('not found') || msg.includes('404')) {
      // Create requires full payload; use defaults for any missing fields
      const createPayload = {
        min_order_amount: num(rest.min_order_amount, 0),
        delivery_fee: num(rest.delivery_fee, 40),
        free_delivery_threshold: num(rest.free_delivery_threshold, 500),
        is_enabled: rest.is_enabled !== undefined ? Boolean(rest.is_enabled) : true,
        show_marquee: rest.show_marquee !== undefined ? Boolean(rest.show_marquee) : true,
        ...(rest.delivery_zones != null && { delivery_zones: rest.delivery_zones }),
      };
      return await apiPost('/delivery-settings/', createPayload);
    }
    throw error;
  }
};

/**
 * Get delivery slots list
 * @param {Object} params - Query parameters (limit, offset, delivery_settings_id, is_active)
 * @returns {Promise<Object>} Delivery slots list
 */
export const getDeliverySlots = async (params = {}) => {
  try {
    return await apiGet('/delivery-slots', params);
  } catch (error) {
    console.error('Error fetching delivery slots:', error);
    return { items: [], total: 0 };
  }
};

/**
 * Create a delivery slot
 * @param {Object} slotData - Delivery slot data
 * @returns {Promise<Object>} Created delivery slot
 */
export const createDeliverySlot = async (slotData) => {
  return await apiPost('/delivery-slots', slotData);
};

/**
 * Update a delivery slot
 * @param {string} slotId - Delivery slot ID
 * @param {Object} slotData - Delivery slot data
 * @returns {Promise<Object>} Updated delivery slot
 */
export const updateDeliverySlot = async (slotId, slotData) => {
  return await apiPatch(`/delivery-slots/${slotId}`, slotData);
};

/**
 * Delete a delivery slot
 * @param {string} slotId - Delivery slot ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteDeliverySlot = async (slotId) => {
  return await apiDelete(`/delivery-slots/${slotId}`);
};
