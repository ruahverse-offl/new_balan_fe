import { apiDelete, apiGet, apiPatch, apiPost } from '../utils/apiClient';

export const getNotificationMasters = async (params = {}) => {
  const response = await apiGet('/notification-master/', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
    is_active: params.is_active,
  });
  return { items: response.items || [], pagination: response.pagination || {} };
};

export const createNotificationMaster = async (payload) => apiPost('/notification-master/', payload);

export const updateNotificationMaster = async (id, payload) =>
  apiPatch(`/notification-master/${id}`, payload);

export const deleteNotificationMaster = async (id) => apiDelete(`/notification-master/${id}`);

export const getNotificationSettings = async (params = {}) => {
  const response = await apiGet('/notification-settings/', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
    user_id: params.user_id,
    is_active: params.is_active,
  });
  return { items: response.items || [], pagination: response.pagination || {} };
};

export const updateNotificationSetting = async (id, payload) =>
  apiPatch(`/notification-settings/${id}`, payload);

export const getNotificationLogs = async (params = {}) => {
  const response = await apiGet('/notification-logs/', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
    send_status: params.send_status,
    channel: params.channel,
  });
  return { items: response.items || [], pagination: response.pagination || {} };
};

