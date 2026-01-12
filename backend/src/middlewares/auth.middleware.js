import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import UserModel from '../models/user.model.js';
import { Logger } from '../utils/logger.js';
import { AuthenticationError } from '../utils/errors.js';

dotenv.config();

// Verify JWT_SECRET is set in environment
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  Logger.error('CRITICAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

/**
 * Middleware function to authenticate the token
 * Verifies JWT token and attaches user information to request
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Extract the token from the Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      Logger.warn('Authentication attempt without token', { ip: req.ip, path: req.path });
      throw new AuthenticationError('Access denied. No token provided.');
    }

    try {
      // Verify the token using the secret key
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check if this is an admin token (userId === 'ADMIN')
      if (decoded.userId === 'ADMIN') {
        // Admin user - no database lookup needed
        req.user = decoded; // Contains userId='ADMIN', email, role='ADMIN'
        req.userDetails = {
          id: 'ADMIN',
          name: 'Administrator',
          email: decoded.email,
          role: 'ADMIN',
        };

        Logger.debug('Admin authenticated successfully', { email: decoded.email });
        next();
      } else {
        // Regular user - find in database
        const user = await UserModel.findById(decoded.userId);
        if (!user) {
          Logger.warn('Token references non-existent user', { userId: decoded.userId });
          throw new AuthenticationError('Invalid token: User not found.');
        }

        // Attach the user information to the request object
        req.user = decoded; // Contains userId, email, role from the token
        req.userDetails = user; // Contains full user object from the database

        Logger.debug('User authenticated successfully', { userId: user.id, email: user.email });
        next();
      }
    } catch (tokenError) {
      if (tokenError.name === 'JsonWebTokenError') {
        Logger.warn('Invalid JWT token', { error: tokenError.message });
        throw new AuthenticationError('Invalid token.');
      }
      if (tokenError.name === 'TokenExpiredError') {
        Logger.warn('Expired JWT token', { expiredAt: tokenError.expiredAt });
        throw new AuthenticationError('Token has expired. Please login again.');
      }
      throw tokenError;
    }

  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Unexpected error during authentication', error, { path: req.path });
    res.status(500).json({
      success: false,
      errorCode: 'AUTH_ERROR',
      message: 'An error occurred during authentication',
    });
  }
};