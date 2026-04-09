/**
 * Marquee Settings API Service
 * Handles coupon marquee visibility only. Does not touch delivery settings.
 */

import { apiGet, apiPatch } from '../utils/apiClient';

/**
 * Get marquee visibility (show_marquee only)
 * @returns {Promise<{ show_marquee: boolean }>}
 */
export const getMarqueeSettings = async () => {
  try {
    return await apiGet('/marquee-settings/');
  } catch (error) {
    if (error.message?.includes('not found')) {
      return { show_marquee: true };
    }
    throw error;
  }
};

/**
 * Update marquee visibility only
 * @param {{ show_marquee: boolean }} data
 * @returns {Promise<{ show_marquee: boolean }>}
 */
export const updateMarqueeSettings = async (data) => {
  return await apiPatch('/marquee-settings/', { show_marquee: Boolean(data.show_marquee) });
};
