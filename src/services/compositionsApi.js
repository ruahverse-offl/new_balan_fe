import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

export const getCompositions = async (params = {}) => {
  const response = await apiGet('/medicine-compositions', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
  });
  return { items: response.items || [], pagination: response.pagination || {} };
};

export const getCompositionById = async (id) => {
  return await apiGet(`/medicine-compositions/${id}`);
};

export const createComposition = async (data) => {
  return await apiPost('/medicine-compositions', data);
};

export const updateComposition = async (id, data) => {
  return await apiPatch(`/medicine-compositions/${id}`, data);
};

export const deleteComposition = async (id) => {
  return await apiDelete(`/medicine-compositions/${id}`);
};
