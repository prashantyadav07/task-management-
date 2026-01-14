/**
 * Database Migration: Add missing is_deleted column to tasks table
 * Run this script if you get the error: column "is_deleted" does not exist
 */

import pool from '../config/db.js';
import { Logger } from '../utils/logger.js';

const migrateDatabase = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Add is_deleted column to tasks table if it doesn't exist
        await client.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
    `);

        // Add index for is_deleted if it doesn't exist
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_is_deleted ON tasks(is_deleted);
    `);

        Logger.info('✅ Database migration completed: is_deleted column added to tasks table');

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        Logger.error('Database migration failed', error);
        throw error;
    } finally {
        client.release();
    }
};

// Run migration
migrateDatabase()
    .then(() => {
        console.log('✅ Migration successful!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    });

export default migrateDatabase;
