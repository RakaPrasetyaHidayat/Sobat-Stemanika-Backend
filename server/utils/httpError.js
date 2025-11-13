/**
 * HTTP Error utilities for consistent error handling across the API
 *
 * This module provides standardized error handling for the STEMANIKA voting system,
 * ensuring consistent error responses and proper HTTP status codes.
 */

/**
 * Custom HTTP Error class for API responses
 * @extends Error
 */
export class HttpError extends Error {
  /**
   * Create a new HTTP error
   * @param {number} status - HTTP status code
   * @param {string} message - Error message
   * @param {any} details - Additional error details (optional)
   */
  constructor(status, message, details = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError);
    }
  }

  /**
   * Convert error to JSON response format
   * @returns {Object} JSON response object
   */
  toJSON() {
    return {
      error: this.message,
      status: this.status,
      ...(this.details && { details: this.details })
    };
  }
}

/**
 * Common HTTP status codes for convenience
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Check if an error is an HttpError instance
 * @param {any} error - Error to check
 * @returns {boolean} True if error is HttpError
 */
export const isHttpError = (error) => error instanceof HttpError;

/**
 * Convert any error to HttpError with appropriate status code
 * @param {any} error - Error to convert
 * @param {number} defaultStatus - Default status code if error is not HttpError
 * @returns {HttpError} HttpError instance
 */
export const toHttpError = (error, defaultStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR) => {
  if (isHttpError(error)) return error;

  const message = error?.message || "Internal server error";
  return new HttpError(defaultStatus, message, error);
};

/**
 * Create validation error for bad request
 * @param {string} message - Validation error message
 * @param {any} details - Validation details
 * @returns {HttpError} HttpError with 400 status
 */
export const createValidationError = (message, details = null) => {
  return new HttpError(HTTP_STATUS.BAD_REQUEST, message, details);
};

/**
 * Create authentication error
 * @param {string} message - Authentication error message
 * @returns {HttpError} HttpError with 401 status
 */
export const createAuthError = (message = "Authentication required") => {
  return new HttpError(HTTP_STATUS.UNAUTHORIZED, message);
};

/**
 * Create authorization error
 * @param {string} message - Authorization error message
 * @returns {HttpError} HttpError with 403 status
 */
export const createForbiddenError = (message = "Access forbidden") => {
  return new HttpError(HTTP_STATUS.FORBIDDEN, message);
};

/**
 * Create not found error
 * @param {string} resource - Resource that was not found
 * @returns {HttpError} HttpError with 404 status
 */
export const createNotFoundError = (resource = "Resource") => {
  return new HttpError(HTTP_STATUS.NOT_FOUND, `${resource} not found`);
};

/**
 * Create conflict error
 * @param {string} message - Conflict error message
 * @returns {HttpError} HttpError with 409 status
 */
export const createConflictError = (message = "Resource conflict") => {
  return new HttpError(HTTP_STATUS.CONFLICT, message);
};

/**
 * Handle async route errors
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped route handler with error handling
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
