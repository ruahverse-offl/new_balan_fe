/**
 * Appointments API Service
 * Handles all appointment-related API calls
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

/**
 * Get list of appointments
 * @param {Object} params - Query parameters (limit, offset, search, sort_by, sort_order, doctor_id, status, date_from, date_to)
 * @returns {Promise<Object>} List of appointments with pagination
 */
export const getAppointments = async (params = {}) => {
  const response = await apiGet('/appointments', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
    doctor_id: params.doctor_id,
    status: params.status,
    date_from: params.date_from,
    date_to: params.date_to,
  });
  
  // Map backend response to frontend format
  return {
    items: response.items || [],
    pagination: response.pagination || {},
  };
};

/**
 * Get appointment by ID
 * @param {string} appointmentId - Appointment UUID
 * @returns {Promise<Object>} Appointment data
 */
export const getAppointmentById = async (appointmentId) => {
  return await apiGet(`/appointments/${appointmentId}`);
};

/**
 * Create a new appointment
 * @param {Object} appointmentData - Appointment data
 * @returns {Promise<Object>} Created appointment
 */
export const createAppointment = async (appointmentData) => {
  return await apiPost('/appointments', appointmentData);
};

/**
 * Update an appointment
 * @param {string} appointmentId - Appointment UUID
 * @param {Object} appointmentData - Updated appointment data
 * @returns {Promise<Object>} Updated appointment
 */
export const updateAppointment = async (appointmentId, appointmentData) => {
  return await apiPatch(`/appointments/${appointmentId}`, appointmentData);
};

/**
 * Delete an appointment (soft delete)
 * @param {string} appointmentId - Appointment UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteAppointment = async (appointmentId) => {
  return await apiDelete(`/appointments/${appointmentId}`);
};
