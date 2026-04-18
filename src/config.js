/**
 * VITE_PROD_CHECK (build-time):
 * - "true"  → online pharmacy / checkout are OFF; show call-to-order “opening soon” experience.
 * - "false" → full online catalog and checkout enabled.
 *
 * Set in `.env`: VITE_PROD_CHECK=true or VITE_PROD_CHECK=false
 */
export const prodCheck = import.meta.env.VITE_PROD_CHECK !== 'true';
