/**
 * Application modules (M_modules) — access-modules RBAC.
 */

import { apiGet, apiPost, apiPatch } from '../utils/apiClient';

export const getModules = async () => {
  const rows = await apiGet('/modules/');
  return Array.isArray(rows) ? rows : [];
};

export const createModule = async (data) => {
  return await apiPost('/modules/', data);
};

export const updateModule = async (id, data) => {
  return await apiPatch(`/modules/${id}`, data);
};
