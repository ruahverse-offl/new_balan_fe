/**
 * Doctors API Service
 * Handles all doctor-related API calls
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

/**
 * Get list of doctors
 * @param {Object} params - Query parameters (limit, offset, search, sort_by, sort_order, is_active)
 * @returns {Promise<Object>} List of doctors with pagination
 */
export const getDoctors = async (params = {}) => {
  const response = await apiGet('/doctors/', {
    limit: Math.min(Number(params.limit) || 100, 100),
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
    is_active: params.is_active,
  });
  
  // Map backend response to frontend format
  return {
    items: response.items || [],
    pagination: response.pagination || {},
  };
};

/**
 * Get doctor by ID
 * @param {string} doctorId - Doctor UUID
 * @returns {Promise<Object>} Doctor data
 */
export const getDoctorById = async (doctorId) => {
  return await apiGet(`/doctors/${doctorId}`);
};

/**
 * Create a new doctor
 * @param {Object} doctorData - Doctor data
 * @returns {Promise<Object>} Created doctor
 */
export const createDoctor = async (doctorData) => {
  return await apiPost('/doctors/', doctorData);
};

/**
 * Update a doctor
 * @param {string} doctorId - Doctor UUID
 * @param {Object} doctorData - Updated doctor data
 * @returns {Promise<Object>} Updated doctor
 */
export const updateDoctor = async (doctorId, doctorData) => {
  return await apiPatch(`/doctors/${doctorId}`, doctorData);
};

/**
 * Delete a doctor (soft delete)
 * @param {string} doctorId - Doctor UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteDoctor = async (doctorId) => {
  return await apiDelete(`/doctors/${doctorId}`);
};
