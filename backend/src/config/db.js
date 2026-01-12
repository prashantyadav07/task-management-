import pg from 'pg';
import dotenv from 'dotenv';
import { Logger } from '../utils/logger.js';

dotenv.config(); // Load environment variables

const { Pool } = pg;

// Validate required database environment variables
const requiredEnvVars = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  Logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Use environment variables for database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10),
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on('error', (err) => {
  Logger.error('Unexpected error on idle client in pool', err);
});

/**
 * Test database connection
 * Returns promise for proper async handling
 */
const connectDB = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (error) {
    Logger.error('Failed to connect to database', error);
    throw error;
  }
};

export { connectDB };
export default pool; // Export the pool for use in models