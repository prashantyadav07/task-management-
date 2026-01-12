import pool from '../config/db.js';
import QUERIES from '../constants/queries.js';
import { Logger } from '../utils/logger.js';
import { DatabaseError } from '../utils/errors.js';

const UserModel = {
  /**
   * Create a new user
   * @throws {DatabaseError}
   */
  create: async (name, email, passwordHash, role) => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.USER.CREATE, [name, email, passwordHash, role]);
      Logger.debug('User created successfully', { userId: result.rows[0]?.id, email });
      return result.rows[0];
    } catch (error) {
      // CRITICAL FIX #1: Better error handling for duplicate email
      // PostgreSQL error code 23505 = unique constraint violation
      if (error.code === '23505' && error.constraint === 'users_email_key') {
        Logger.warn('Duplicate email error in user creation', { email });
        // Throw error with code so controller can handle it
        error.message = 'Duplicate email';
      }
      Logger.error('Failed to create user', error, { email });
      throw error; // Pass the original error to preserve error code
    } finally {
      client.release();
    }
  },

  /**
   * Find a user by email
   * @throws {DatabaseError}
   */
  findByEmail: async (email) => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.USER.FIND_BY_EMAIL, [email]);
      return result.rows[0]; // Returns undefined if not found
    } catch (error) {
      Logger.error('Failed to find user by email', error, { email });
      throw new DatabaseError('Database query failed', error);
    } finally {
      client.release();
    }
  },

  /**
   * Find a user by ID
   * @throws {DatabaseError}
   */
  findById: async (id) => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.USER.FIND_BY_ID, [id]);
      return result.rows[0]; // Returns undefined if not found
    } catch (error) {
      Logger.error('Failed to find user by ID', error, { userId: id });
      throw new DatabaseError('Database query failed', error);
    } finally {
      client.release();
    }
  },

  /**
   * Find all users on the platform
   * @throws {DatabaseError}
   */
  findAll: async () => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.USER.FIND_ALL);
      return result.rows;
    } catch (error) {
      Logger.error('Failed to fetch all users', error);
      throw new DatabaseError('Failed to fetch users', error);
    } finally {
      client.release();
    }
  },

  /**
   * Get total count of users on the platform
   * @throws {DatabaseError}
   */
  countAll: async () => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.USER.COUNT_ALL);
      return parseInt(result.rows[0].total_users, 10);
    } catch (error) {
      Logger.error('Failed to count users', error);
      throw new DatabaseError('Failed to count users', error);
    } finally {
      client.release();
    }
  },
};

export default UserModel;