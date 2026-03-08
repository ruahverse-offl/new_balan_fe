/**
 * Product Categories API Service
 * Handles product category-related API calls
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiClient';

/**
 * Get list of product categories
 * @param {Object} params - Query parameters (limit, offset, search, sort_by, sort_order, is_active)
 * @returns {Promise<Object>} List of categories with pagination
 */
export const getCategories = async (params = {}) => {
  const response = await apiGet('/product-categories', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
    is_active: params.is_active !== undefined ? params.is_active : true,
  });
  
  // Map backend response to frontend format
  return {
    items: response.items || [],
    pagination: response.pagination || {},
  };
};

/**
 * Get category by ID
 * @param {string} categoryId - Category UUID
 * @returns {Promise<Object>} Category data
 */
export const getCategoryById = async (categoryId) => {
  return await apiGet(`/product-categories/${categoryId}`);
};

/**
 * Create a new category
 * @param {Object} categoryData - Category data
 * @returns {Promise<Object>} Created category
 */
export const createCategory = async (categoryData) => {
  return await apiPost('/product-categories', categoryData);
};

/**
 * Update a category
 * @param {string} categoryId - Category UUID
 * @param {Object} categoryData - Updated category data
 * @returns {Promise<Object>} Updated category
 */
export const updateCategory = async (categoryId, categoryData) => {
  return await apiPatch(`/product-categories/${categoryId}`, categoryData);
};

/**
 * Delete a category (soft delete)
 * @param {string} categoryId - Category UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteCategory = async (categoryId) => {
  return await apiDelete(`/product-categories/${categoryId}`);
};
