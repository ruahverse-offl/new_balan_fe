/**
 * Safe logging utilities
 * Wraps console methods to prevent crashes in environments where console may not be available.
 */

export const safeLog = (...args) => {
  try {
    console.log(...args);
  } catch (e) {
    // silently ignore
  }
};

export const safeError = (...args) => {
  try {
    console.error(...args);
  } catch (e) {
    // silently ignore
  }
};

export const safeWarn = (...args) => {
  try {
    console.warn(...args);
  } catch (e) {
    // silently ignore
  }
};
