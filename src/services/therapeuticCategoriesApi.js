import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

export const getTherapeuticCategories = async (params = {}) => {
  const response = await apiGet('/therapeutic-categories', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
  });
  return { items: response.items || [], pagination: response.pagination || {} };
};

export const getTherapeuticCategoryById = async (id) => {
  return await apiGet(`/therapeutic-categories/${id}`);
};

export const createTherapeuticCategory = async (data) => {
  return await apiPost('/therapeutic-categories', data);
};

export const updateTherapeuticCategory = async (id, data) => {
  return await apiPatch(`/therapeutic-categories/${id}`, data);
};

export const deleteTherapeuticCategory = async (id) => {
  return await apiDelete(`/therapeutic-categories/${id}`);
};
