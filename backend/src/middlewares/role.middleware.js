import { Logger } from '../utils/logger.js';
import { AuthorizationError } from '../utils/errors.js';

/**
 * Middleware function to require specific roles
 * Must be used after authenticateToken middleware
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        Logger.error('User role not found in request', null, { path: req.path, userId: req.user?.userId });
        return res.status(500).json({
          success: false,
          errorCode: 'AUTH_MIDDLEWARE_ERROR',
          message: 'Authentication error: User role not found',
        });
      }

      // Check if the user's role is included in the allowed roles array
      if (!allowedRoles.includes(userRole)) {
        Logger.warn('Unauthorized role access attempt', {
          userId: req.user?.userId,
          userRole,
          allowedRoles,
          path: req.path,
        });

        throw new AuthorizationError(
          `Access denied. This operation requires one of the following roles: ${allowedRoles.join(', ')}`
        );
      }

      // Role check passed, proceed to the next middleware or route handler
      Logger.debug('Role authorization passed', { userId: req.user?.userId, role: userRole });
      next();

    } catch (error) {
      if (error instanceof AuthorizationError) {
        return res.status(error.statusCode).json({
          success: false,
          errorCode: error.errorCode,
          message: error.message,
        });
      }

      Logger.error('Unexpected error during role authorization', error, { path: req.path });
      res.status(500).json({
        success: false,
        errorCode: 'AUTHORIZATION_ERROR',
        message: 'An error occurred during authorization check',
      });
    }
  };
};