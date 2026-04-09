import { useEffect } from 'react';
import { getDeliverySettings } from '../services/deliveryApi';

/**
 * When the user returns to this browser tab or window, refetch delivery settings so
 * admin changes (e.g. turning home delivery off) apply without a full page reload.
 */
export function useRefreshDeliverySettingsOnFocus(setDeliverySettings) {
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      getDeliverySettings()
        .then((s) => setDeliverySettings(s))
        .catch(() => {});
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [setDeliverySettings]);
}
