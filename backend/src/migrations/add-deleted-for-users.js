import pool from '../config/db.js';
import { Logger } from '../utils/logger.js';

/**
 * Migration: Add deleted_for_users column to team_chat_messages
 * Tracks which users have deleted the message for themselves
 */
const addDeletedForUsersColumn = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Add column to track user-specific deletions
        await client.query(`
      ALTER TABLE team_chat_messages 
      ADD COLUMN IF NOT EXISTS deleted_for_users INTEGER[] DEFAULT '{}';
    `);

        await client.query('COMMIT');
        Logger.info('Migration completed: added deleted_for_users column');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        Logger.error('Migration failed', error);
        throw error;
    } finally {
        client.release();
    }
};

export default addDeletedForUsersColumn;
