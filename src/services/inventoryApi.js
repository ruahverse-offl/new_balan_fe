/**
 * Inventory: stock levels and low-stock alerts (admin).
 */

import { apiGet, apiPatch } from '../utils/apiClient';

/**
 * @param {string[]} offeringIds - medicine_brand_offering UUIDs
 */
export const getStockByOfferings = async (offeringIds) => {
  if (!offeringIds?.length) return { items: [] };
  const q = offeringIds.map((id) => String(id).split('_').pop() || String(id)).join(',');
  return apiGet('/inventory/stock', { offering_ids: q });
};

/**
 * Active low-stock alerts (requires INVENTORY_VIEW).
 */
export const getInventoryAlerts = async (params = {}) => {
  return apiGet('/inventory/alerts', {
    limit: params.limit ?? 100,
    offset: params.offset ?? 0,
  });
};

/**
 * Set absolute stock for an offering (requires INVENTORY_UPDATE).
 * @param {string} offeringId
 * @param {number} stockQuantity
 */
export const updateOfferingStock = async (offeringId, stockQuantity) => {
  return apiPatch(`/inventory/offering/${offeringId}`, { stock_quantity: stockQuantity });
};
