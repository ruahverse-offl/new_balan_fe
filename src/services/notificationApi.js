import { apiDelete, apiGet, apiPatch, apiPost } from '../utils/apiClient';

export const getNotificationMasters = async (params = {}) => {
  const query = {
    limit: params.limit || 100,
    offset: params.offset || 0,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
  };
  if (params.search) query.search = params.search;
  if (params.is_active !== undefined && params.is_active !== null) query.is_active = params.is_active;

  const response = await apiGet('/notification-master', query);
  return { items: response.items || [], pagination: response.pagination || {} };
};

export const createNotificationMaster = async (payload) => apiPost('/notification-master', payload);

export const updateNotificationMaster = async (id, payload) =>
  apiPatch(`/notification-master/${id}`, payload);

export const deleteNotificationMaster = async (id) => apiDelete(`/notification-master/${id}`);

export const getNotificationSettings = async (params = {}) => {
  const query = {
    limit: params.limit || 100,
    offset: params.offset || 0,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
  };
  if (params.search) query.search = params.search;
  if (params.user_id) query.user_id = params.user_id;
  if (params.is_active !== undefined && params.is_active !== null) query.is_active = params.is_active;

  const response = await apiGet('/notification-settings', query);
  return { items: response.items || [], pagination: response.pagination || {} };
};

export const updateNotificationSetting = async (id, payload) =>
  apiPatch(`/notification-settings/${id}`, payload);

export const getNotificationLogs = async (params = {}) => {
  const query = {
    limit: params.limit || 20,
    offset: params.offset || 0,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
  };
  if (params.send_status) query.send_status = params.send_status;
  if (params.channel) query.channel = params.channel;
  if (params.user_id) query.user_id = params.user_id;

  const response = await apiGet('/notification-logs', query);
  return { items: response.items || [], pagination: response.pagination || {} };
};
