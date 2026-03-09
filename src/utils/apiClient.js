/**
 * API Client Utility
 * Provides a centralized way to make authenticated API calls
 */

import { buildApiUrl } from '../config/api';

/**
 * Normalize endpoint to ensure trailing slash for collection routes
 */
const normalizeEndpoint = (endpoint) => {
  const [path, query] = endpoint.split('?');

  const segments = path.split('/').filter(Boolean);

  // If endpoint looks like /resource/id → do not add slash
  const isIdEndpoint = segments.length > 1;

  let normalizedPath = path;

  if (!isIdEndpoint && !path.endsWith('/')) {
    normalizedPath = `${path}/`;
  }

  return query ? `${normalizedPath}?${query}` : normalizedPath;
};

/**
 * Get authentication token from localStorage
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
 * Make an authenticated API request
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();

  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const url = buildApiUrl(normalizedEndpoint);

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token && token !== 'admin-token') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      localStorage.removeItem('nb_auth');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      throw new Error('Session expired. Please login again.');
    }

    return response;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Network error. Please check your connection.');
    }

    throw error;
  }
};

/**
 * GET request
 */
export const apiGet = async (endpoint, params = {}) => {
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  ).toString();

  const url = queryString ? `${endpoint}?${queryString}` : endpoint;

  const response = await apiRequest(url, { method: 'GET' });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: 'Request failed' }));
    const err = new Error(body.detail || body.message || 'Request failed');
    err.status = response.status;
    throw err;
  }

  return response.json();
};

/**
 * POST request
 */
export const apiPost = async (endpoint, data) => {
  const response = await apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || error.message || 'Request failed');
  }

  return response.json();
};

/**
 * PATCH request
 */
export const apiPatch = async (endpoint, data) => {
  const response = await apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || error.message || 'Request failed');
  }

  return response.json();
};

/**
 * DELETE request
 */
export const apiDelete = async (endpoint) => {
  const response = await apiRequest(endpoint, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || error.message || 'Request failed');
  }

  return response.json();
};
