import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

export const getBrands = async (params = {}) => {
  // Trailing slash required so FastAPI matches GET / (list) not GET /{brand_id}
  const response = await apiGet('/medicine-brands/', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
    is_available: params.is_available,
  });
  return { items: response.items || [], pagination: response.pagination || {} };
};

export const getBrandById = async (id) => {
  return await apiGet(`/medicine-brands/${id}`);
};

export const createBrand = async (data) => {
  return await apiPost('/medicine-brands', data);
};

export const updateBrand = async (id, data) => {
  return await apiPatch(`/medicine-brands/${id}`, data);
};

export const deleteBrand = async (id) => {
  return await apiDelete(`/medicine-brands/${id}`);
};
