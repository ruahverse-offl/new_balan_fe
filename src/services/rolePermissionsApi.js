/**
 * Role Permissions API Service
 * Handles role-permission assignment API calls
 */

import { apiGet, apiPost, apiDelete } from '../utils/apiClient';

export const getRolePermissions = async (params = {}) => {
  const response = await apiGet('/role-permissions', {
    limit: params.limit ?? 100,
    offset: params.offset ?? 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
  });
  return { items: response.items || [], pagination: response.pagination || {} };
};

export const createRolePermission = async (data) => {
  return await apiPost('/role-permissions', data);
};

export const deleteRolePermission = async (id) => {
  return await apiDelete(`/role-permissions/${id}`);
};
