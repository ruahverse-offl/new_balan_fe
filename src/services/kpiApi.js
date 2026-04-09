import { apiGet } from '../utils/apiClient';

/**
 * Aggregate KPIs for the Statistics tab (total orders, medicines, sales revenue).
 * @returns {Promise<{ total_orders: number, total_medicines: number, total_sales: string|number }>}
 */
export const getKpiSummary = async () => {
  return apiGet('/kpi/summary');
};
