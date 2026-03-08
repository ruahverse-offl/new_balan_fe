import { apiGet } from '../utils/apiClient';

export const getCouponUsages = async (params = {}) => {
  const response = await apiGet('/coupon-usages', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
  });
  return { items: response.items || [], pagination: response.pagination || {} };
};

export const getCouponUsageById = async (id) => {
  return await apiGet(`/coupon-usages/${id}`);
};
