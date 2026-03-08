/**
 * API Configuration
 * 
 * This file handles API base URL configuration for different environments.
 * In production, VITE_API_BASE_URL should be set in environment variables.
 */

// Get API base URL from environment variable or use default
const getApiBaseUrl = () => {
  // Vite uses import.meta.env for environment variables
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const apiPrefix = import.meta.env.VITE_API_PREFIX || '/api/v1';
  
  if (baseUrl) {
    // Remove trailing slash if present
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    return `${cleanBaseUrl}${apiPrefix}`;
  }
  
  // Development default
  if (import.meta.env.DEV) {
    return 'http://localhost:8000/api/v1';
  }
  
  // Production fallback (should not happen if env var is set)
  console.warn('VITE_API_BASE_URL not set, using default');
  return '/api/v1';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 30000, // 30 seconds
};

// Helper to build full API endpoint URLs
export const buildApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

// Log API config in development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    baseUrl: API_CONFIG.BASE_URL,
    env: import.meta.env.MODE,
  });
}
