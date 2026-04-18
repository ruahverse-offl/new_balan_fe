import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

/** @deprecated Use medicine_categories backend; paths are /medicine-categories */
const BASE = '/medicine-categories';

export const getTherapeuticCategories = async (params = {}) => {
  // Trailing slash matches FastAPI @router.get("/") and avoids 307 redirect to .../medicine-categories/
  const response = await apiGet(`${BASE}/`, {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
  });
  return { items: response.items || [], pagination: response.pagination || {} };
};

export const getTherapeuticCategoryById = async (id) => {
  return await apiGet(`${BASE}/${id}`);
};

export const createTherapeuticCategory = async (data) => {
  return await apiPost(`${BASE}/`, data);
};

export const updateTherapeuticCategory = async (id, data) => {
  return await apiPatch(`${BASE}/${id}`, data);
};

export const deleteTherapeuticCategory = async (id) => {
  return await apiDelete(`${BASE}/${id}`);
};
