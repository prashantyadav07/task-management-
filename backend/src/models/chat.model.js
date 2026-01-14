import pool from '../config/db.js';
import { Logger } from '../utils/logger.js';
import { DatabaseError, NotFoundError } from '../utils/errors.js';

const ChatModel = {
  /**
   * Create a new chat message
   * @throws {DatabaseError}
   */
  create: async (teamId, userId, message) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO team_chat_messages (team_id, user_id, message)
         VALUES ($1, $2, $3)
         RETURNING id, team_id, user_id, message, 
         TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at, 
         is_deleted`,
        [teamId, userId, message]
      );

      Logger.debug('Chat message created successfully', {
        messageId: result.rows[0]?.id,
        teamId,
        userId,
      });

      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to create chat message', error, { teamId, userId });
      throw new DatabaseError('Failed to create chat message', error);
    } finally {
      client.release();
    }
  },

  /**
   * Find all messages for a team (excluding soft-deleted ones)
   * Returns messages in chronological order (oldest to newest)
   * @throws {DatabaseError}
   */
  findByTeam: async (teamId, limit = 100, offset = 0) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          m.id, 
          m.team_id, 
          m.user_id, 
          m.message, 
          TO_CHAR(m.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at,
          m.is_deleted,
          u.name as user_name,
          u.email as user_email
         FROM team_chat_messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.team_id = $1 AND m.is_deleted = FALSE
         ORDER BY m.created_at ASC
         LIMIT $2 OFFSET $3`,
        [teamId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      Logger.error('Failed to fetch team messages', error, { teamId });
      throw new DatabaseError('Failed to fetch team messages', error);
    } finally {
      client.release();
    }
  },

  /**
   * Get a specific message by ID
   * @throws {DatabaseError}
   */
  findById: async (messageId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          m.id, 
          m.team_id, 
          m.user_id, 
          m.message, 
          m.created_at,
          m.is_deleted,
          u.name as user_name,
          u.email as user_email
         FROM team_chat_messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.id = $1`,
        [messageId]
      );

      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to find chat message by ID', error, { messageId });
      throw new DatabaseError('Database query failed', error);
    } finally {
      client.release();
    }
  },

  /**
   * Soft delete a message (mark as deleted without removing from DB)
   * @throws {DatabaseError}
   */
  softDelete: async (messageId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE team_chat_messages 
         SET is_deleted = TRUE, updated_at = NOW()
         WHERE id = $1 
         RETURNING id, team_id, user_id, message, created_at, is_deleted`,
        [messageId]
      );

      if (result.rowCount === 0) {
        throw new NotFoundError('Message not found');
      }

      Logger.debug('Chat message soft deleted', { messageId });
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      Logger.error('Failed to soft delete chat message', error, { messageId });
      throw new DatabaseError('Failed to delete chat message', error);
    } finally {
      client.release();
    }
  },

  /**
   * Hard delete a message (permanently remove from DB)
   * Use only for admin operations or data cleanup
   * @throws {DatabaseError}
   */
  hardDelete: async (messageId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM team_chat_messages 
         WHERE id = $1 
         RETURNING id`,
        [messageId]
      );

      if (result.rowCount === 0) {
        throw new NotFoundError('Message not found');
      }

      Logger.debug('Chat message hard deleted', { messageId });
      return { success: true, messageId };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      Logger.error('Failed to hard delete chat message', error, { messageId });
      throw new DatabaseError('Failed to delete chat message', error);
    } finally {
      client.release();
    }
  },

  /**
   * Count total messages in a team (excluding deleted)
   * @throws {DatabaseError}
   */
  countTeamMessages: async (teamId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT COUNT(*) as total_messages 
         FROM team_chat_messages 
         WHERE team_id = $1 AND is_deleted = FALSE`,
        [teamId]
      );

      return result.rows[0]?.total_messages || 0;
    } catch (error) {
      Logger.error('Failed to count team messages', error, { teamId });
      throw new DatabaseError('Failed to count messages', error);
    } finally {
      client.release();
    }
  },
};

export default ChatModel;
