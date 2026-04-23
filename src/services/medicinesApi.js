/**
 * Medicines API Service
 * Handles all medicine/product-related API calls
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

/**
 * Get list of medicines
 * @param {Object} params - Query parameters (limit, offset, search, sort_by, sort_order)
 * @returns {Promise<Object>} List of medicines with pagination
 */
export const getMedicines = async (params = {}) => {
  const response = await apiGet('/medicines/', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
    is_available: params.is_available,
    include_brands: params.include_brands,
  });
  
  // Map backend response to frontend format
  return {
    items: response.items || [],
    pagination: response.pagination || {},
  };
};

/**
 * Fetch ALL medicines for dropdowns (paginates until complete)
 * @returns {Promise<Array>} Full list of medicines sorted by name
 */
export const getAllMedicinesForSelect = async () => {
  const limit = 200;
  let offset = 0;
  const all = [];
  let hasMore = true;
  while (hasMore) {
    const res = await getMedicines({
      limit,
      offset,
      sort_by: 'name',
      sort_order: 'asc',
    }).catch(() => ({ items: [], pagination: {} }));
    const items = res.items || [];
    all.push(...items);
    hasMore = items.length === limit;
    offset += limit;
  }
  return all;
};

/**
 * Get medicine by ID
 * @param {string} medicineId - Medicine UUID
 * @returns {Promise<Object>} Medicine data
 */
export const getMedicineById = async (medicineId, params = {}) => {
  const q = {
    // Default true so detail pages always receive nested brand lines unless explicitly disabled.
    include_brands: params.include_brands !== false,
  };
  return await apiGet(`/medicines/${medicineId}`, q);
};

/**
 * Create a new medicine
 * @param {Object} medicineData - Medicine data
 * @returns {Promise<Object>} Created medicine
 */
export const createMedicine = async (medicineData) => {
  return await apiPost('/medicines/', medicineData);
};

/**
 * Update a medicine
 * @param {string} medicineId - Medicine UUID
 * @param {Object} medicineData - Updated medicine data
 * @returns {Promise<Object>} Updated medicine
 */
export const updateMedicine = async (medicineId, medicineData) => {
  return await apiPatch(`/medicines/${medicineId}`, medicineData);
};

/**
 * Delete a medicine (soft delete)
 * @param {string} medicineId - Medicine UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteMedicine = async (medicineId) => {
  return await apiDelete(`/medicines/${medicineId}`);
};
