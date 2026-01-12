import pool from '../config/db.js';
import QUERIES from '../constants/queries.js';
import { generateSecureToken } from '../utils/token.js';
import { Logger } from '../utils/logger.js';
import { DatabaseError } from '../utils/errors.js';

const InviteModel = {
  /**
   * Create a new invitation record
   * @throws {DatabaseError}
   */
  create: async (email, teamId) => {
    const client = await pool.connect();
    try {
      const token = generateSecureToken();
      // Set expiration time to 24 hours from now
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const result = await client.query(QUERIES.INVITE.CREATE, [email, teamId, token, expiresAt]);

      Logger.debug('Invitation created successfully', {
        inviteId: result.rows[0]?.id,
        email,
        teamId,
        expiresAt,
      });

      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to create invitation', error, { email, teamId });
      throw new DatabaseError('Failed to create invitation', error);
    } finally {
      client.release();
    }
  },

  /**
   * Find an invitation by its token
   * @throws {DatabaseError}
   */
  findByToken: async (token) => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.INVITE.FIND_BY_TOKEN, [token]);
      return result.rows[0]; // Returns undefined if not found
    } catch (error) {
      Logger.error('Failed to find invitation by token', error);
      throw new DatabaseError('Database query failed', error);
    } finally {
      client.release();
    }
  },

  /**
   * Update the status of an invitation to 'ACCEPTED' once used
   * @throws {DatabaseError}
   */
  updateStatusUsed: async (inviteId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.INVITE.UPDATE_STATUS_USED, ['ACCEPTED', inviteId]);

      Logger.debug('Invitation status updated to ACCEPTED', { inviteId });

      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to update invitation status', error, { inviteId });
      throw new DatabaseError('Failed to update invitation status', error);
    } finally {
      client.release();
    }
  },

  /**
   * Optional: Cleanup function to delete expired invites
   * Can be called periodically via a cron job
   */
  deleteExpired: async () => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.INVITE.DELETE_EXPIRED);
      Logger.info('Expired invitations cleaned up', { deletedCount: result.rowCount });
      return result.rowCount;
    } catch (error) {
      Logger.error('Failed to delete expired invitations', error);
      throw new DatabaseError('Failed to cleanup expired invitations', error);
    } finally {
      client.release();
    }
  },
};

export default InviteModel;