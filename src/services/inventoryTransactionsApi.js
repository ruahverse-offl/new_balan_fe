import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

export const getInventoryTransactions = async (params = {}) => {
  const response = await apiGet('/inventory-transactions', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
    medicine_brand_id: params.medicine_brand_id || undefined,
  });
  return { items: response.items || [], pagination: response.pagination || {} };
};

export const getInventoryTransactionById = async (id) => {
  return await apiGet(`/inventory-transactions/${id}`);
};

/** Transaction detail with linked order summary (when it's a SALE with reference_order_id) */
export const getInventoryTransactionDetail = async (transactionId) => {
  return await apiGet(`/inventory-transactions/${transactionId}/detail`);
};

export const createInventoryTransaction = async (data) => {
  return await apiPost('/inventory-transactions', data);
};

export const updateInventoryTransaction = async (id, data) => {
  return await apiPatch(`/inventory-transactions/${id}`, data);
};

export const deleteInventoryTransaction = async (id) => {
  return await apiDelete(`/inventory-transactions/${id}`);
};
