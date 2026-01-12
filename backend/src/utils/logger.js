/**
 * Structured Logger Utility
 * Provides consistent, production-ready logging with error tracking
 */

const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

const isDevelopment = process.env.NODE_ENV !== 'production';
const SILENCE_STARTUP_LOGS = process.env.SILENCE_STARTUP_LOGS === 'true';

/** 
 * Format log message with timestamp and level
 */
const formatLog = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const baseLog = `[${timestamp}] [${level}] ${message}`;
  
  if (data) {
    return `${baseLog} | Data: ${JSON.stringify(data)}`;
  }
  return baseLog;
};

/**
 * Sanitize error for logging (remove sensitive data)
 */
const sanitizeError = (error) => {
  const sanitized = {
    message: error.message,
    name: error.name,
    ...(isDevelopment && { stack: error.stack }), // Only in development
  };

  // Preserve database error details for debugging
  if (error.code) sanitized.code = error.code;
  if (error.detail) sanitized.detail = error.detail;

  return sanitized;
};

export const Logger = {
  /**
   * Log error messages with sanitization
   */
  error: (message, error = null, additionalData = null) => {
    const errorData = error ? sanitizeError(error) : null;
    const combinedData = { ...errorData, ...additionalData };
    console.error(formatLog(LogLevel.ERROR, message, combinedData));
  },

  /**
   * Log warning messages
   */
  warn: (message, data = null) => {
    console.warn(formatLog(LogLevel.WARN, message, data));
  },

  /**
   * Log info messages
   */
  info: (message, data = null) => {
    if (!SILENCE_STARTUP_LOGS) {
      console.log(formatLog(LogLevel.INFO, message, data));
    }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (message, data = null) => {
    if (isDevelopment) {
      console.log(formatLog(LogLevel.DEBUG, message, data));
    }
  },
};

export default Logger;
