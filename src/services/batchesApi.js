import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

export const getBatches = async (params = {}) => {
  const response = await apiGet('/product-batches', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
  });
  return { items: response.items || [], pagination: response.pagination || {} };
};

export const getBatchById = async (id) => {
  return await apiGet(`/product-batches/${id}`);
};

/** Full batch detail: batch + transactions for this batch + order items that used this batch */
export const getBatchDetail = async (batchId) => {
  return await apiGet(`/product-batches/${batchId}/detail`);
};

export const createBatch = async (data) => {
  return await apiPost('/product-batches', data);
};

export const updateBatch = async (id, data) => {
  return await apiPatch(`/product-batches/${id}`, data);
};

export const deleteBatch = async (id) => {
  return await apiDelete(`/product-batches/${id}`);
};
