/**
 * Permissions API Service
 * Handles permission-related API calls
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

export const getPermissions = async (params = {}) => {
  const response = await apiGet('/permissions', {
    limit: params.limit ?? 100,
    offset: params.offset ?? 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
  });
  return { items: response.items || [], pagination: response.pagination || {} };
};

export const getPermissionById = async (permissionId) => {
  return await apiGet(`/permissions/${permissionId}`);
};

export const createPermission = async (data) => {
  return await apiPost('/permissions', data);
};

export const updatePermission = async (id, data) => {
  return await apiPatch(`/permissions/${id}`, data);
};

export const deletePermission = async (id) => {
  return await apiDelete(`/permissions/${id}`);
};
