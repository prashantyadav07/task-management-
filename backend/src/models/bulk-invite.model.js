import pool from '../config/db.js';
import QUERIES from '../constants/queries.js';
import { generateSecureToken } from '../utils/token.js';
import { Logger } from '../utils/logger.js';
import { DatabaseError, NotFoundError } from '../utils/errors.js';
import { v4 as uuidv4 } from 'uuid';

const BulkInviteModel = {
  /**
   * Create a bulk invitation batch
   * @param {number} teamId - Team ID
   * @param {number} creatorUserId - User ID creating the bulk invite
   * @param {string[]} emails - Array of email addresses to invite
   * @returns {Object} - Batch details and invitation items
   * @throws {DatabaseError}
   */
  createBatch: async (teamId, creatorUserId, emails) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate unique batch ID
      const batchId = `batch_${uuidv4()}`;

      // Create bulk invite batch record
      const batchResult = await client.query(
        QUERIES.BULK_INVITE.CREATE_BATCH,
        [batchId, teamId, creatorUserId, emails.length]
      );

      const batch = batchResult.rows[0];

      // Create individual invite items for each email
      const inviteItems = [];
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      for (const email of emails) {
        const token = generateSecureToken();
        const itemResult = await client.query(
          QUERIES.BULK_INVITE.CREATE_ITEM,
          [batchId, email, token, expiresAt]
        );
        inviteItems.push(itemResult.rows[0]);
      }

      await client.query('COMMIT');

      Logger.info('Bulk invitation batch created', {
        batchId,
        teamId,
        creatorUserId,
        totalInvites: emails.length,
      });

      return {
        batch,
        items: inviteItems,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      Logger.error('Failed to create bulk invitation batch', error, { teamId, creatorUserId });
      throw new DatabaseError('Failed to create bulk invitations', error);
    } finally {
      client.release();
    }
  },

  /**
   * Find a bulk invite batch by ID
   * @throws {DatabaseError}
   */
  findBatchById: async (batchId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.BULK_INVITE.FIND_BATCH_BY_ID, [batchId]);
      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to find bulk invite batch', error, { batchId });
      throw new DatabaseError('Database query failed', error);
    } finally {
      client.release();
    }
  },

  /**
   * Find a bulk invite item by token
   * @throws {DatabaseError}
   */
  findItemByToken: async (token) => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.BULK_INVITE.FIND_ITEM_BY_TOKEN, [token]);
      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to find bulk invite item by token', error);
      throw new DatabaseError('Database query failed', error);
    } finally {
      client.release();
    }
  },

  /**
   * Update the status of a bulk invite item
   * @throws {DatabaseError}
   */
  updateItemStatus: async (token, status = 'ACCEPTED') => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.BULK_INVITE.UPDATE_ITEM_STATUS, [status, token]);

      if (result.rowCount === 0) {
        throw new NotFoundError('Bulk invite item not found');
      }

      Logger.debug('Bulk invite item status updated', { token, status });

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      Logger.error('Failed to update bulk invite item status', error);
      throw new DatabaseError('Failed to update invite status', error);
    } finally {
      client.release();
    }
  },

  /**
   * Update batch counts when an invite is accepted
   * @throws {DatabaseError}
   */
  updateBatchCounts: async (batchId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.BULK_INVITE.UPDATE_BATCH_COUNTS, [batchId]);

      Logger.debug('Batch counts updated', { batchId });

      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to update batch counts', error, { batchId });
      throw new DatabaseError('Failed to update batch counts', error);
    } finally {
      client.release();
    }
  },

  /**
   * Get all items in a batch
   * @throws {DatabaseError}
   */
  getBatchItems: async (batchId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.BULK_INVITE.GET_BATCH_ITEMS, [batchId]);
      return result.rows;
    } catch (error) {
      Logger.error('Failed to fetch batch items', error, { batchId });
      throw new DatabaseError('Failed to fetch batch items', error);
    } finally {
      client.release();
    }
  },

  /**
   * Cleanup expired bulk invite items
   * @throws {DatabaseError}
   */
  deleteExpiredItems: async () => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM bulk_invite_items WHERE expires_at < NOW()'
      );
      Logger.info('Expired bulk invite items cleaned up', { deletedCount: result.rowCount });
      return result.rowCount;
    } catch (error) {
      Logger.error('Failed to delete expired bulk invite items', error);
      throw new DatabaseError('Failed to cleanup expired bulk invites', error);
    } finally {
      client.release();
    }
  },
};

export default BulkInviteModel;
