import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

export const getTestBookings = async (params = {}) => {
  const response = await apiGet('/test-bookings', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
  });
  return { items: response.items || [], pagination: response.pagination || {} };
};

export const getTestBookingById = async (id) => {
  return await apiGet(`/test-bookings/${id}`);
};

export const createTestBooking = async (data) => {
  return await apiPost('/test-bookings', data);
};

export const updateTestBooking = async (id, data) => {
  return await apiPatch(`/test-bookings/${id}`, data);
};

export const deleteTestBooking = async (id) => {
  return await apiDelete(`/test-bookings/${id}`);
};
