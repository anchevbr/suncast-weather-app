/**
 * Logging Utility
 * Centralized logging that respects development/production environments
 * Debug logs only appear in development mode
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Debug logging - only appears in development
   * @param {...any} args - Arguments to log
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Info logging - only appears in development
   * @param {...any} args - Arguments to log
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Warning logging - always appears
   * @param {...any} args - Arguments to log
   */
  warn: (...args) => {
    console.warn(...args);
  },

  /**
   * Error logging - always appears
   * @param {...any} args - Arguments to log
   */
  error: (...args) => {
    console.error(...args);
  }
};
