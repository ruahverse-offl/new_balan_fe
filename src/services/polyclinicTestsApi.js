import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

export const getPolyclinicTests = async (params = {}) => {
  const response = await apiGet('/polyclinic-tests', {
    limit: Math.min(Number(params.limit) || 100, 100),
    offset: params.offset || 0,
    search: params.search,
    is_active: params.is_active,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'asc',
  });
  return { items: response.items || [], pagination: response.pagination || {} };
};

export const getPolyclinicTestById = async (id) => {
  return await apiGet(`/polyclinic-tests/${id}`);
};

export const createPolyclinicTest = async (data) => {
  return await apiPost('/polyclinic-tests', data);
};

export const updatePolyclinicTest = async (id, data) => {
  return await apiPatch(`/polyclinic-tests/${id}`, data);
};

export const deletePolyclinicTest = async (id) => {
  return await apiDelete(`/polyclinic-tests/${id}`);
};
