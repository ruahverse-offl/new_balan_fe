import { apiGet } from '../utils/apiClient';

export const getCustomers = async (params = {}) => {
  const response = await apiGet('/users/customers', {
    limit: params.limit || 50,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
  });
  return {
    items: response.items || [],
    pagination: response.pagination || {},
  };
};

export const getCustomerOrders = async (customerId, params = {}) => {
  const response = await apiGet('/orders', {
    customer_id: customerId,
    limit: params.limit || 50,
    offset: params.offset || 0,
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  return {
    items: response.items || [],
    pagination: response.pagination || {},
  };
};
