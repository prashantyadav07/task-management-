// src/config/db.js
import pg from 'pg';
import dotenv from 'dotenv';
import { Logger } from '../utils/logger.js';

// Suppress dotenv logs
const originalLog = console.log;
console.log = () => {};
dotenv.config();
console.log = originalLog;

const { Pool } = pg;

// Check DATABASE_URL
if (!process.env.DATABASE_URL) {
  Logger.error('CRITICAL: DATABASE_URL is not set in .env');
  console.error('❌ ERROR: DATABASE_URL is required.');
  console.error('Format: postgresql://username:password@host:database?sslmode=require');
  process.exit(1);
}

// Create PostgreSQL Pool for Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon serverless
  },
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),           // Max connections
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),  // 30s
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '10000', 10), // 10s
});

// Handle unexpected pool errors
pool.on('error', (err) => {
  Logger.error('Unexpected error on idle client', err);
  console.error('❌ Database pool error:', err.message);
});

/**
 * Connect to the database and test connection
 */
export const connectDB = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()'); // Test query
    client.release();
    Logger.info('✅ Database connected successfully');
    return true;
  } catch (error) {
    Logger.error('Failed to connect to database', error);
    console.error('❌ Cannot connect to database. Check DATABASE_URL and network.');
    throw error; // Throw to prevent server start if needed
  }
};

export default pool;
