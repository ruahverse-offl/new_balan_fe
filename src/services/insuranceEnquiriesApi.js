/**
 * Insurance Enquiries API Service
 * Handles all insurance enquiry-related API calls
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

/**
 * Create a new insurance enquiry
 * @param {Object} enquiryData - Enquiry data
 * @returns {Promise<Object>} Created enquiry
 */
export const createInsuranceEnquiry = async (enquiryData) => {
  return await apiPost('/insurance-enquiries', enquiryData);
};

/**
 * Get list of insurance enquiries
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} List of enquiries with pagination
 */
export const getInsuranceEnquiries = async (params = {}) => {
  const response = await apiGet('/insurance-enquiries', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
    status: params.status,
  });

  return {
    items: response.items || [],
    pagination: response.pagination || {},
  };
};

/**
 * Get insurance enquiry by ID
 * @param {string} enquiryId - Enquiry UUID
 * @returns {Promise<Object>} Enquiry data
 */
export const getInsuranceEnquiryById = async (enquiryId) => {
  return await apiGet(`/insurance-enquiries/${enquiryId}`);
};

/**
 * Update an insurance enquiry
 * @param {string} enquiryId - Enquiry UUID
 * @param {Object} enquiryData - Updated data
 * @returns {Promise<Object>} Updated enquiry
 */
export const updateInsuranceEnquiry = async (enquiryId, enquiryData) => {
  return await apiPatch(`/insurance-enquiries/${enquiryId}`, enquiryData);
};

/**
 * Delete an insurance enquiry (soft delete)
 * @param {string} enquiryId - Enquiry UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteInsuranceEnquiry = async (enquiryId) => {
  return await apiDelete(`/insurance-enquiries/${enquiryId}`);
};
