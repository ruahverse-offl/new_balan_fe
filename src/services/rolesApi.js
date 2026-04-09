/**
 * Roles API Service
 * Handles role-related API calls
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

export const getRoles = async (params = {}) => {
  const response = await apiGet('/roles/', {
    limit: params.limit ?? 100,
    offset: params.offset ?? 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
  });
  return { items: response.items || [], pagination: response.pagination || {} };
};

export const getRoleById = async (roleId) => {
  return await apiGet(`/roles/${roleId}`);
};

export const createRole = async (data) => {
  return await apiPost('/roles/', data);
};

export const updateRole = async (id, data) => {
  return await apiPatch(`/roles/${id}`, data);
};

export const deleteRole = async (id) => {
  return await apiDelete(`/roles/${id}`);
};
