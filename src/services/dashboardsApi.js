import { apiGet } from '../utils/apiClient';

/**
 * Get finance dashboard data
 * @param {Object} params - Query parameters (period, trend_period, trend_granularity, include_charts, monthly_trend_months)
 * @returns {Promise<Object>} Finance dashboard data
 */
export const getFinanceDashboard = async (params = {}) => {
  return apiGet('/dashboards/finance', params);
};

/**
 * Get inventory dashboard data
 * @param {Object} params - Query parameters (period, include_charts, low_stock_threshold, expiry_days, top_products_limit, expiry_months)
 * @returns {Promise<Object>} Inventory dashboard data
 */
export const getInventoryDashboard = async (params = {}) => {
  return apiGet('/dashboards/inventory', params);
};

/**
 * Get orders dashboard data
 * @param {Object} params - Query parameters (period, include_charts, trend_days)
 * @returns {Promise<Object>} Orders dashboard data
 */
export const getOrdersDashboard = async (params = {}) => {
  return apiGet('/dashboards/orders', params);
};

/**
 * Get sales dashboard data
 * @param {Object} params - Query parameters (period, include_charts, top_products_limit)
 * @returns {Promise<Object>} Sales dashboard data
 */
export const getSalesDashboard = async (params = {}) => {
  return apiGet('/dashboards/sales', params);
};
