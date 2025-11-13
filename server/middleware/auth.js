import { authorizeToken } from "../services/authService.js";
import { createAuthError, createForbiddenError } from "../utils/httpError.js";

/**
 * Authentication middleware for the STEMANIKA voting system
 *
 * This module provides middleware functions for authentication and authorization,
 * ensuring secure access to protected API endpoints.
 */

/**
 * Extract Bearer token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null if invalid
 */
const extractBearerToken = (authHeader) => {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  // Check for valid Bearer token format
  const bearerRegex = /^Bearer\s+[A-Za-z0-9\-_.]+$/;
  if (!bearerRegex.test(authHeader)) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  const token = parts[1].trim();
  return token.length > 0 ? token : null;
};

/**
 * Middleware to require authentication for protected routes
 * Attaches authenticated user to req.user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      const error = createAuthError("Missing or invalid authorization token");
      return res.status(error.status).json(error.toJSON());
    }

    const user = await authorizeToken(token);
    req.user = user;
    next();
  } catch (error) {
    const authError = createAuthError("Authentication failed");
    res.status(authError.status).json(authError.toJSON());
  }
};

/**
 * Middleware factory to require specific user role
 * Must be used after requireAuth middleware
 * @param {string|string[]} requiredRoles - Required role(s) for access
 * @returns {Function} Role-based authorization middleware
 */
export const requireRole = (requiredRoles) => (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      const error = createAuthError("Authentication required");
      return res.status(error.status).json(error.toJSON());
    }

    const userRole = user.role;
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (!roles.includes(userRole)) {
      const error = createForbiddenError(`Access denied. Required role: ${roles.join(' or ')}`);
      return res.status(error.status).json(error.toJSON());
    }

    next();
  } catch (error) {
    const forbiddenError = createForbiddenError("Authorization failed");
    res.status(forbiddenError.status).json(forbiddenError.toJSON());
  }
};

/**
 * Middleware to allow optional authentication
 * Attaches user to req.user if token is valid, but doesn't fail if missing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (token) {
      const user = await authorizeToken(token);
      req.user = user;
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on auth errors
    next();
  }
};

/**
 * Middleware to check if user owns a resource or has admin role
 * @param {Function} getResourceOwnerId - Function to get owner ID from request
 * @returns {Function} Ownership check middleware
 */
export const requireOwnershipOrAdmin = (getResourceOwnerId) => (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      const error = createAuthError("Authentication required");
      return res.status(error.status).json(error.toJSON());
    }

    // Admins can access everything
    if (user.role === 'admin') {
      return next();
    }

    const resourceOwnerId = getResourceOwnerId(req);
    if (user.id !== resourceOwnerId) {
      const error = createForbiddenError("Access denied. Resource ownership required");
      return res.status(error.status).json(error.toJSON());
    }

    next();
  } catch (error) {
    const forbiddenError = createForbiddenError("Ownership verification failed");
    res.status(forbiddenError.status).json(forbiddenError.toJSON());
  }
};
