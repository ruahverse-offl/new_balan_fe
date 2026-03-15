/**
 * API Configuration
 *
 * All values come from env (VITE_*).
 * - VITE_API_BASE_URL: backend origin (no trailing slash).
 * - VITE_API_PREFIX: API path prefix, default /api/v1.
 */

const apiPrefix = import.meta.env.VITE_API_PREFIX || '/api/v1';

const getApiBaseUrl = () => {
  let baseUrl = import.meta.env.VITE_API_BASE_URL;

  // In dev, if not set, point to local backend so delivery timings and other APIs work
  if (!baseUrl && import.meta.env.DEV) {
    baseUrl = 'http://127.0.0.1:8000';
  }

  if (!baseUrl) {
    console.warn('VITE_API_BASE_URL not set; using same-origin', apiPrefix);
    return apiPrefix;
  }

  const cleanBaseUrl = String(baseUrl).replace(/\/$/, '');
  return `${cleanBaseUrl}${apiPrefix}`;
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 30000, // 30 seconds default timeout for API calls
};

/**
 * Build full API URL from a relative endpoint.
 * Examples:
 *  buildApiUrl('/auth/login') -> https://api.example.com/api/v1/auth/login
 *  buildApiUrl('medicines?limit=10') -> https://api.example.com/api/v1/medicines?limit=10
 */
export const buildApiUrl = (endpoint = '') => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

