/**
 * Single-city / fixed service area: city, state, PIN, and country can be
 * locked at build time via Vite env (must use VITE_ prefix to reach the client).
 *
 * .env example:
 *   VITE_DELIVERY_CITY=Palakkad
 *   VITE_DELIVERY_STATE=Kerala
 *   VITE_DELIVERY_PINCODE=678001
 *   VITE_DELIVERY_COUNTRY=India
 */

function trimEnv(value) {
    if (value == null) return '';
    return String(value).trim();
}

/**
 * Reads frozen delivery fields from import.meta.env.
 *
 * @returns {{ values: { city: string, state: string, pincode: string, country: string }, frozen: { city: boolean, state: boolean, pincode: boolean, country: boolean } }}
 */
export function getDeliveryLocationFromEnv() {
    const city = trimEnv(import.meta.env.VITE_DELIVERY_CITY);
    const state = trimEnv(import.meta.env.VITE_DELIVERY_STATE);
    const pincode = trimEnv(import.meta.env.VITE_DELIVERY_PINCODE);
    const country = trimEnv(import.meta.env.VITE_DELIVERY_COUNTRY);
    return {
        values: { city, state, pincode, country },
        frozen: {
            city: Boolean(city),
            state: Boolean(state),
            pincode: Boolean(pincode),
            country: Boolean(country),
        },
    };
}

/**
 * True if at least one delivery location field is non-empty after merge.
 *
 * @param {{ city?: string, state?: string, pincode?: string, country?: string }} loc
 * @returns {boolean}
 */
export function deliveryLocationHasAny(loc) {
    if (!loc || typeof loc !== 'object') return false;
    return Boolean(
        String(loc.city || '').trim() ||
            String(loc.state || '').trim() ||
            String(loc.pincode || '').trim() ||
            String(loc.country || '').trim(),
    );
}

/**
 * Overlay env-defined fields onto admin/API delivery_location. Env wins per field when set.
 *
 * @param {Record<string, unknown> | null | undefined} apiLocation
 * @returns {{ city: string, state: string, pincode: string, country: string }}
 */
export function mergeStaticDeliveryLocation(apiLocation) {
    const { values, frozen } = getDeliveryLocationFromEnv();
    const b = apiLocation && typeof apiLocation === 'object' ? apiLocation : {};
    const fallbackCountry = values.country || 'India';
    return {
        city: frozen.city ? values.city : trimEnv(b.city),
        state: frozen.state ? values.state : trimEnv(b.state),
        pincode: frozen.pincode ? values.pincode : trimEnv(b.pincode),
        country: frozen.country
            ? values.country
            : trimEnv(b.country) || fallbackCountry,
    };
}

/**
 * User-facing line: home delivery is limited to the configured service city.
 * Returns null when no city name is available (nothing to mention).
 *
 * @param {{ city?: string, state?: string } | null | undefined} loc
 * @returns {string | null}
 */
export function getDeliveryCityOnlyNotice(loc) {
    const city = trimEnv(loc?.city);
    if (!city) return null;
    const state = trimEnv(loc?.state);
    if (state) {
        return `Deliveries are made only within ${city}, ${state}. Please use an address in this area.`;
    }
    return `Deliveries are made only within ${city}. Please use an address in this area.`;
}
