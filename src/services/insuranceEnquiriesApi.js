import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

export const createInsuranceEnquiry = async (data) => {
  return await apiPost('/insurance-enquiries', data);
};

export const getInsuranceEnquiries = async (params = {}) => {
  const response = await apiGet('/insurance-enquiries', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
    status: params.status,
  });
  return {
    items: response.items || [],
    pagination: response.pagination || {},
  };
};

export const updateInsuranceEnquiry = async (id, data) => {
  return await apiPatch(`/insurance-enquiries/${id}`, data);
};

export const deleteInsuranceEnquiry = async (id) => {
  return await apiDelete(`/insurance-enquiries/${id}`);
};
