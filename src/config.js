/**
 * When true: pharmacy and checkout are fully available.
 * When false: pharmacy shows "coming soon", checkout is disabled/redirected.
 * Set via .env: VITE_PROD_CHECK=true or VITE_PROD_CHECK=false
 */
export const prodCheck = import.meta.env.VITE_PROD_CHECK === 'true';
