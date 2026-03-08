/**
 * API Configuration
 * Reads API configuration strictly from .env
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api/v1"

// Stop build if env variable is missing
if (!API_BASE_URL) {
  throw new Error(
    "❌ VITE_API_BASE_URL is not defined in .env file"
  )
}

// Clean trailing slash
const cleanBaseUrl = API_BASE_URL.replace(/\/$/, "")

export const API_CONFIG = {
  BASE_URL: `${cleanBaseUrl}${API_PREFIX}`,
  TIMEOUT: 30000
}

/**
 * Build full API URL
 */
export const buildApiUrl = (endpoint = "") => {
  const cleanEndpoint = endpoint.startsWith("/")
    ? endpoint.slice(1)
    : endpoint

  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`
}
