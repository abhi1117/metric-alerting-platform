/**
 * Logger utility for structured logging
 * Provides consistent log formatting and levels
 */

const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
};

const logger = {
  /**
   * Log info level message
   * @param {string} message - Log message
   * @param {object} data - Additional context data
   */
  info: (message, data = {}) => {
    console.log(`[${getTimestamp()}] [${LOG_LEVELS.INFO}] ${message}`, data);
  },

  /**
   * Log warning level message
   * @param {string} message - Log message
   * @param {object} data - Additional context data
   */
  warn: (message, data = {}) => {
    console.warn(`[${getTimestamp()}] [${LOG_LEVELS.WARN}] ${message}`, data);
  },

  /**
   * Log error level message
   * @param {string} message - Log message
   * @param {Error|object} error - Error object or data
   */
  error: (message, error = {}) => {
    const errorData = error instanceof Error 
      ? { stack: error.stack, message: error.message }
      : error;
    console.error(`[${getTimestamp()}] [${LOG_LEVELS.ERROR}] ${message}`, errorData);
  },

  /**
   * Log debug level message
   * @param {string} message - Log message
   * @param {object} data - Additional context data
   */
  debug: (message, data = {}) => {
    if (process.env.DEBUG) {
      console.log(`[${getTimestamp()}] [${LOG_LEVELS.DEBUG}] ${message}`, data);
    }
  },
};

/**
 * Get current timestamp in ISO format
 * @returns {string} ISO timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

module.exports = logger;
