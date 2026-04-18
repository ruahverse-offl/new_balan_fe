import { useEffect } from 'react';
import { getDeliverySettings } from '../services/deliveryApi';

/**
 * Subscribers receive fresh settings when the user returns to the tab/window so admin
 * changes (e.g. home delivery off) apply without a full reload.
 *
 * Implementation: one global listener + debounce + single in-flight request. Previously
 * each component (Pharmacy, Cart, Profile, Checkout) registered its own listeners, so
 * one focus event triggered N parallel GET /delivery-settings/ calls.
 */
const subscribers = new Set();
let debounceTimer = null;
let listenersAttached = false;
let inFlightPromise = null;

function notifyAll(settings) {
  subscribers.forEach((setState) => {
    try {
      setState(settings);
    } catch {
      /* ignore */
    }
  });
}

function runRefresh() {
  if (document.visibilityState !== 'visible') return;
  if (inFlightPromise) return;
  inFlightPromise = getDeliverySettings()
    .then((s) => {
      notifyAll(s);
      return s;
    })
    .catch(() => {})
    .finally(() => {
      inFlightPromise = null;
    });
}

function scheduleRefresh() {
  if (document.visibilityState !== 'visible') return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    runRefresh();
  }, 400);
}

function attachGlobalListeners() {
  if (listenersAttached) return;
  listenersAttached = true;
  const handler = () => scheduleRefresh();
  document.addEventListener('visibilitychange', handler);
  window.addEventListener('focus', handler);
}

/**
 * Register this component's setDeliverySettings to receive refetches on tab focus.
 * Only one network request runs per debounced focus/visibility burst, shared by all subscribers.
 */
export function useRefreshDeliverySettingsOnFocus(setDeliverySettings) {
  useEffect(() => {
    subscribers.add(setDeliverySettings);
    attachGlobalListeners();
    return () => {
      subscribers.delete(setDeliverySettings);
    };
  }, [setDeliverySettings]);
}
