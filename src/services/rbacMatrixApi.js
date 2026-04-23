/**
 * Role × module CRUD matrix (M_module_role_permissions).
 */

import { apiGet, apiPut } from '../utils/apiClient';

export const getRoleMatrix = async (roleId) => {
  return await apiGet(`/rbac/matrix?role_id=${encodeURIComponent(roleId)}`);
};

export const putRoleMatrix = async (payload) => {
  return await apiPut('/rbac/matrix', payload);
};
