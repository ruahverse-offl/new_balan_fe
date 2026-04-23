/**
 * API Client Utility
 * Centralized helpers for making authenticated API calls.
 */

import { buildApiUrl, API_CONFIG } from '../config/api';

/**
 * Get authentication token from localStorage
 * @returns {string|null} JWT token or null
 */
export const getAuthToken = () => {
  try {
    const storedAuth = localStorage.getItem('nb_auth');
    if (storedAuth) {
      const parsed = JSON.parse(storedAuth);
      return parsed.token || null;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return null;
};

/**
 * Turn FastAPI `detail` (string | object | array) into a single message for UI.
 */
export const formatApiErrorDetail = (detail) => {
  if (detail == null || detail === '') return 'Request failed';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map((d) => {
      if (typeof d === 'string') return d;
      if (d && typeof d.msg === 'string') return d.msg;
      if (d && typeof d.message === 'string') return d.message;
      return null;
    }).filter(Boolean);
    if (parts.length) return parts.join(' ');
  }
  if (typeof detail === 'object' && detail.msg) return String(detail.msg);
  try {
    return JSON.stringify(detail);
  } catch {
    return 'Request failed';
  }
};

/** User-friendly message for connection timeout / unreachable server */
const getNetworkErrorMessage = (error) => {
  if (error?.name === 'AbortError') {
    return 'Connection timed out. The server may be slow or unreachable. Please try again.';
  }
  const msg = (error && error.message) ? String(error.message) : '';
  if (/timeout|timed out|ERR_CONNECTION_TIMED_OUT|Failed to fetch|Load failed|NetworkError|network/i.test(msg)) {
    return 'Connection timed out or server unreachable. Check your internet and try again.';
  }
  if (error instanceof TypeError && msg.includes('fetch')) {
    return 'Network error. Please check your connection.';
  }
  return null;
};

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (relative, e.g. '/orders' or 'orders/123')
 * @param {Object} options - Fetch options plus optional { timeout }
 * @returns {Promise<Response>} Fetch response
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const url = buildApiUrl(endpoint);
  const timeoutMs = options.timeout ?? API_CONFIG.TIMEOUT ?? 30000;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token && token !== 'admin-token') {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const config = {
    ...options,
    headers,
    signal: controller.signal,
  };

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    // Handle 401 Unauthorized - token might be expired
    if (response.status === 401) {
      localStorage.removeItem('nb_auth');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please login again.');
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    const friendly = getNetworkErrorMessage(error);
    if (friendly) {
      throw new Error(friendly);
    }
    throw error;
  }
};

/**
 * Make a GET request
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @param {Object} options - Optional { timeout } in ms
 * @returns {Promise<Object>} Response data
 */
export const apiGet = async (endpoint, params = {}, options = {}) => {
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  ).toString();

  const url = queryString ? `${endpoint}?${queryString}` : endpoint;
  const response = await apiRequest(url, { method: 'GET', ...options });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: 'Request failed' }));
    const msg = formatApiErrorDetail(body.detail) || body.message || 'Request failed';
    const err = new Error(msg);
    err.status = response.status;
    throw err;
  }

  return response.json();
};

/**
 * Make a POST request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body
 * @returns {Promise<Object>} Response data
 */
export const apiPost = async (endpoint, data) => {
  const response = await apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    const msg = formatApiErrorDetail(error.detail) || error.message || 'Request failed';
    const err = new Error(msg);
    err.status = response.status;
    throw err;
  }

  return response.json();
};

/**
 * Make a PATCH request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body
 * @returns {Promise<Object>} Response data
 */
export const apiPatch = async (endpoint, data) => {
  const response = await apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    const msg = formatApiErrorDetail(error.detail) || error.message || 'Request failed';
    const err = new Error(msg);
    err.status = response.status;
    throw err;
  }

  return response.json();
};

/**
 * Make a PUT request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body
 * @returns {Promise<Object>} Response data
 */
export const apiPut = async (endpoint, data) => {
  const response = await apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    const msg = formatApiErrorDetail(error.detail) || error.message || 'Request failed';
    const err = new Error(msg);
    err.status = response.status;
    throw err;
  }

  return response.json();
};

/**
 * Make a DELETE request
 * @param {string} endpoint - API endpoint
 * @returns {Promise<Object>} Response data
 */
export const apiDelete = async (endpoint) => {
  const response = await apiRequest(endpoint, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    const err = new Error(error.detail || error.message || 'Request failed');
    err.status = response.status;
    throw err;
  }

  return response.json();
};

/**
 * POST multipart/form-data (do not set Content-Type — browser sets boundary).
 * @param {string} endpoint - e.g. '/upload'
 * @param {FormData} formData
 */
export const apiPostFormData = async (endpoint, formData) => {
  const token = getAuthToken();
  const url = buildApiUrl(endpoint);
  const headers = {};
  if (token && token !== 'admin-token') {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(url, { method: 'POST', headers, body: formData });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    const msg = formatApiErrorDetail(error.detail) || error.message || 'Request failed';
    const err = new Error(msg);
    err.status = response.status;
    throw err;
  }
  return response.json();
};

