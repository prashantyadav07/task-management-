/**
 * Automatic Admin Bootstrap
 * 
 * Checks if an admin user exists on application startup.
 * If not, creates one automatically using credentials from environment variables.
 * 
 * Environment Variables Required:
 * - ADMIN_EMAIL: Email for the admin user (e.g., admin@example.com)
 * - ADMIN_PASSWORD: Password for the admin user (must be strong in production)
 * 
 * This is idempotent - safe to run multiple times without side effects.
 * Works across development, staging, and production environments.
 * 
 * @example
 * ADMIN_EMAIL=admin@company.com
 * ADMIN_PASSWORD=StrongSecurePassword123!
 */

import pool from './db.js';
import bcrypt from 'bcrypt';
import { Logger } from '../utils/logger.js';

/**
 * Get admin credentials from environment variables with validation
 * @returns {{email: string, password: string, name: string}}
 * @throws {Error} If required environment variables are missing
 */
const getAdminCredentials = () => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!adminEmail) {
    throw new Error('CRITICAL: ADMIN_EMAIL environment variable is not set');
  }
  if (!adminPassword) {
    throw new Error('CRITICAL: ADMIN_PASSWORD environment variable is not set');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(adminEmail)) {
    throw new Error(`INVALID: ADMIN_EMAIL "${adminEmail}" is not a valid email format`);
  }

  // Validate password strength (minimum 8 characters recommended)
  if (adminPassword.length < 6) {
    Logger.warn('Admin password is shorter than recommended (minimum 8 characters)', {
      passwordLength: adminPassword.length,
    });
  }

  return {
    email: adminEmail,
    password: adminPassword,
    name: 'Administrator', // Default name for admin user
  };
};

/**
 * Bootstrap admin user if it doesn't exist
 * Safe to call multiple times - only creates user if it doesn't exist
 * Reads credentials from ADMIN_EMAIL and ADMIN_PASSWORD environment variables
 * 
 * @returns {Promise<{created: boolean, message: string, adminEmail?: string}>}
 * @throws {Error} If environment variables are missing or invalid
 */
export const bootstrapAdminUser = async () => {
  let credentials;

  try {
    credentials = getAdminCredentials();
  } catch (error) {
    Logger.error('Admin bootstrap configuration error', error);
    throw error;
  }

  const client = await pool.connect();
  
  try {
    // Check if admin user already exists
    const existingAdmin = await client.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [credentials.email]
    );

    // If admin user exists, log and return (idempotent)
    if (existingAdmin.rows.length > 0) {
      const admin = existingAdmin.rows[0];
      if (admin.role === 'ADMIN') {
        return {
          created: false,
          message: `Admin user ${credentials.email} already exists`,
          adminEmail: credentials.email,
        };
      } else {
        // User exists but is not admin - this is unexpected but we don't modify it
        Logger.warn('User exists with admin email but is not ADMIN role', {
          email: admin.email,
          role: admin.role,
        });
        return {
          created: false,
          message: `User ${credentials.email} exists but role is ${admin.role}, not ADMIN`,
          adminEmail: credentials.email,
        };
      }
    }

    // Admin user doesn't exist - create it
    // Hash the password using bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(credentials.password, 10);

    // Insert admin user
    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, name, email, role, created_at`,
      [credentials.name, credentials.email, passwordHash, 'ADMIN']
    );

    const newAdmin = result.rows[0];

    return {
      created: true,
      message: `Admin user ${credentials.email} created successfully`,
      adminEmail: credentials.email,
    };

  } catch (error) {
    // Handle duplicate email error gracefully
    if (error.code === '23505' && error.constraint === 'users_email_key') {
      Logger.warn('Admin email already exists in database (race condition)', {
        email: credentials.email,
      });
      return {
        created: false,
        message: `Admin user with email ${credentials.email} already exists`,
        adminEmail: credentials.email,
      };
    }

    // Any other error
    Logger.error('Failed to bootstrap admin user', error, {
      email: credentials.email,
    });
    throw error;

  } finally {
    client.release();
  }
};

/**
 * Verify admin user exists and is properly configured
 * Use this for health checks
 * Reads email from ADMIN_EMAIL environment variable
 * 
 * @returns {Promise<{exists: boolean, admin: object|null, email: string}>}
 * @throws {Error} If ADMIN_EMAIL environment variable is missing
 */
export const verifyAdminUser = async () => {
  let credentials;

  try {
    credentials = getAdminCredentials();
  } catch (error) {
    // For verify, just log warning and return false rather than throwing
    Logger.warn('Cannot verify admin - environment variables not configured', {
      error: error.message,
    });
    return {
      exists: false,
      admin: null,
      email: process.env.ADMIN_EMAIL || 'ADMIN_EMAIL not set',
    };
  }

  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT id, name, email, role, created_at FROM users WHERE email = $1 AND role = $2',
      [credentials.email, 'ADMIN']
    );

    if (result.rows.length === 0) {
      return {
        exists: false,
        admin: null,
        email: credentials.email,
      };
    }

    return {
      exists: true,
      admin: result.rows[0],
      email: credentials.email,
    };

  } catch (error) {
    Logger.error('Failed to verify admin user', error);
    throw error;

  } finally {
    client.release();
  }
};

export default bootstrapAdminUser;
