import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

const BRANDS_BASE = '/brands';

/**
 * Shared brand master CRUD (trade names / lines).
 */
export const listBrandMasters = async (params = {}) => {
  const response = await apiGet(`${BRANDS_BASE}/`, {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'name',
    sort_order: params.sort_order || 'asc',
    is_active: params.is_active,
  });
  return { items: response.items || [], pagination: response.pagination || {} };
};

/** Load all brand master rows (backend max limit is 200 per request). */
export const fetchAllBrandMasters = async (params = {}) => {
  const { limit: _ignore, offset: _ignoreOff, ...rest } = params;
  const pageLimit = 200;
  let offset = 0;
  const all = [];
  for (;;) {
    const res = await listBrandMasters({
      ...rest,
      limit: pageLimit,
      offset,
      sort_by: rest.sort_by || 'name',
      sort_order: rest.sort_order || 'asc',
    });
    const batch = res.items || [];
    all.push(...batch);
    if (batch.length < pageLimit) break;
    offset += pageLimit;
  }
  return all;
};

export const getBrandMasterById = async (id) => apiGet(`${BRANDS_BASE}/${id}`);

export const createBrandMaster = async (data) => apiPost(`${BRANDS_BASE}/`, data);

export const updateBrandMaster = async (id, data) => apiPatch(`${BRANDS_BASE}/${id}`, data);

export const deleteBrandMaster = async (id) => apiDelete(`${BRANDS_BASE}/${id}`);

/**
 * Flatten medicine–brand offerings from GET /medicines?include_brands=true.
 */
export const getBrands = async (params = {}) => {
  const response = await apiGet('/medicines/', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
    is_available: params.is_available,
    include_brands: true,
  });
  const items = [];
  for (const m of response.items || []) {
    const medicineName = m.name || '—';
    for (const b of m.brands || []) {
      items.push({ ...b, medicine_name: medicineName });
    }
  }
  return { items, pagination: response.pagination || {} };
};

/** Create medicine–brand offering (junction row). Body: medicine_id, brand_id, manufacturer, mrp, … */
export const createBrand = async (data) => apiPost('/medicine-brands', data);

export const updateBrand = async (id, data) => apiPatch(`/medicine-brands/${id}`, data);

export const deleteBrand = async (id) => apiDelete(`/medicine-brands/${id}`);
