/**
 * Delivery Settings API Service
 * Admin: free-delivery band (min / max), delivery fee when outside band, slots, on/off.
 */

import { apiGet, apiPost, apiPatch } from '../utils/apiClient';

/**
 * Get delivery settings (singleton).
 */
export const getDeliverySettings = async () => {
  try {
    return await apiGet('/delivery-settings/');
  } catch (error) {
    if (error.message.includes('not found')) {
      return {
        is_enabled: true,
        show_marquee: true,
        delivery_fee: 40,
        free_delivery_min_amount: 500,
        free_delivery_max_amount: null,
        min_order_amount: 0,
        delivery_slot_times: [],
        delivery_schedule: {
          delivery_on: true,
          customer_message: 'Orders are accepted online; delivery times follow store operations.',
        },
      };
    }
    throw error;
  }
};

/**
 * Create or update delivery settings (free-delivery min/max for PATCH/POST body).
 */
export const updateDeliverySettings = async (settingsData) => {
  const num = (v, def) => (v != null && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : def);
  const rest = { ...settingsData };
  const payload = {};
  if (rest.free_delivery_min_amount != null && rest.free_delivery_min_amount !== '') {
    payload.free_delivery_min_amount = num(rest.free_delivery_min_amount, 500);
  }
  if (rest.free_delivery_max_amount !== undefined) {
    const raw = rest.free_delivery_max_amount;
    if (raw === '' || raw === null) {
      payload.free_delivery_max_amount = null;
    } else {
      payload.free_delivery_max_amount = num(raw, null);
    }
  }
  if (rest.is_enabled !== undefined) {
    payload.is_enabled = Boolean(rest.is_enabled);
  }
  if (rest.show_marquee !== undefined) {
    payload.show_marquee = Boolean(rest.show_marquee);
  }
  if (rest.delivery_slot_times !== undefined) {
    const rows = Array.isArray(rest.delivery_slot_times) ? rest.delivery_slot_times : [];
    payload.delivery_slot_times = rows
      .map((row) => ({
        slot_time: String(row?.slot_time ?? row?.time ?? '').trim(),
        is_active: row?.is_active !== false,
      }))
      .filter((row) => row.slot_time);
  }
  if (rest.delivery_fee !== undefined && rest.delivery_fee !== null && rest.delivery_fee !== '') {
    const df = num(rest.delivery_fee, null);
    if (df != null && !Number.isNaN(df) && df >= 0) {
      payload.delivery_fee = df;
    }
  }
  try {
    return await apiPatch('/delivery-settings/', payload);
  } catch (error) {
    const msg = error?.message || '';
    if (msg.includes('not found') || msg.includes('404')) {
      const createPayload = {
        free_delivery_min_amount: num(rest.free_delivery_min_amount, 500),
        free_delivery_max_amount:
          rest.free_delivery_max_amount === '' || rest.free_delivery_max_amount == null
            ? null
            : num(rest.free_delivery_max_amount, null),
        is_enabled: rest.is_enabled !== undefined ? Boolean(rest.is_enabled) : true,
        show_marquee: rest.show_marquee !== undefined ? Boolean(rest.show_marquee) : true,
        min_order_amount: 0,
        delivery_fee:
          rest.delivery_fee !== undefined && rest.delivery_fee !== null && rest.delivery_fee !== ''
            ? num(rest.delivery_fee, 40)
            : 40,
      };
      if (rest.delivery_slot_times !== undefined) {
        const rows = Array.isArray(rest.delivery_slot_times) ? rest.delivery_slot_times : [];
        createPayload.delivery_slot_times = rows
          .map((row) => ({
            slot_time: String(row?.slot_time ?? row?.time ?? '').trim(),
            is_active: row?.is_active !== false,
          }))
          .filter((row) => row.slot_time);
      }
      return await apiPost('/delivery-settings/', createPayload);
    }
    throw error;
  }
};
