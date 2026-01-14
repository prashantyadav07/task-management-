import pool from '../config/db.js';
import QUERIES from '../constants/queries.js';
import { Logger } from '../utils/logger.js';
import { DatabaseError, NotFoundError } from '../utils/errors.js';

const OwnershipModel = {
  /**
   * Track team creation for authorization and delete permissions
   * @throws {DatabaseError}
   */
  createTeamOwnership: async (teamId, creatorUserId, creatorRole) => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.TEAM_OWNERSHIP.CREATE, [
        teamId,
        creatorUserId,
        creatorRole,
      ]);

      Logger.debug('Team ownership recorded', {
        teamId,
        creatorUserId,
        creatorRole,
      });

      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to create team ownership record', error, { teamId, creatorUserId });
      throw new DatabaseError('Failed to record team ownership', error);
    } finally {
      client.release();
    }
  },

  /**
   * Get team ownership details
   * @throws {DatabaseError}
   */
  getTeamOwnership: async (teamId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.TEAM_OWNERSHIP.FIND_BY_TEAM, [teamId]);
      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to find team ownership', error, { teamId });
      throw new DatabaseError('Database query failed', error);
    } finally {
      client.release();
    }
  },

  /**
   * Check if user is authorized to delete a team
   * Only the team creator can delete (for both admins and members)
   * @throws {DatabaseError}
   */
  canDeleteTeam: async (teamId, userId) => {
    try {
      const ownership = await this.getTeamOwnership(teamId);
      if (!ownership) {
        // Fallback: check if user is team owner in teams table
        const client = await pool.connect();
        try {
          const result = await client.query(
            'SELECT owner_id FROM teams WHERE id = $1',
            [teamId]
          );
          if (result.rows.length === 0) {
            throw new NotFoundError('Team not found');
          }
          return result.rows[0].owner_id === userId;
        } finally {
          client.release();
        }
      }
      return ownership.creator_user_id === userId;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      Logger.error('Failed to check team delete authorization', error, { teamId, userId });
      throw new DatabaseError('Failed to verify delete permissions', error);
    }
  },

  /**
   * Track task creation for authorization and delete permissions
   * @throws {DatabaseError}
   */
  createTaskOwnership: async (taskId, creatorUserId, creatorRole) => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.TASK_OWNERSHIP.CREATE, [
        taskId,
        creatorUserId,
        creatorRole,
      ]);

      Logger.debug('Task ownership recorded', {
        taskId,
        creatorUserId,
        creatorRole,
      });

      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to create task ownership record', error, { taskId, creatorUserId });
      throw new DatabaseError('Failed to record task ownership', error);
    } finally {
      client.release();
    }
  },

  /**
   * Get task ownership details
   * @throws {DatabaseError}
   */
  getTaskOwnership: async (taskId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.TASK_OWNERSHIP.FIND_BY_TASK, [taskId]);
      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to find task ownership', error, { taskId });
      throw new DatabaseError('Database query failed', error);
    } finally {
      client.release();
    }
  },

  /**
   * Check if user is authorized to delete a task
   * Only admins can delete tasks (check task ownership)
   * @throws {DatabaseError}
   */
  canDeleteTask: async (taskId, userId, userRole) => {
    try {
      // Only admins can delete tasks
      if (userRole !== 'ADMIN') {
        return false;
      }

      const ownership = await this.getTaskOwnership(taskId);
      if (!ownership) {
        // Fallback: check if user is the one who assigned the task
        const client = await pool.connect();
        try {
          const result = await client.query(
            'SELECT assigned_by_user_id FROM tasks WHERE id = $1',
            [taskId]
          );
          if (result.rows.length === 0) {
            throw new NotFoundError('Task not found');
          }
          return result.rows[0].assigned_by_user_id === userId;
        } finally {
          client.release();
        }
      }
      // Only the admin who created the task can delete it
      return ownership.creator_user_id === userId && ownership.creator_role === 'ADMIN';
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      Logger.error('Failed to check task delete authorization', error, { taskId, userId });
      throw new DatabaseError('Failed to verify delete permissions', error);
    }
  },

  /**
   * Delete team ownership record (called when team is deleted)
   * @throws {DatabaseError}
   */
  deleteTeamOwnership: async (teamId) => {
    const client = await pool.connect();
    try {
      await client.query(QUERIES.TEAM_OWNERSHIP.DELETE, [teamId]);
      Logger.debug('Team ownership record deleted', { teamId });
      return true;
    } catch (error) {
      Logger.error('Failed to delete team ownership record', error, { teamId });
      throw new DatabaseError('Failed to delete team ownership record', error);
    } finally {
      client.release();
    }
  },

  /**
   * Delete task ownership record (called when task is deleted)
   * @throws {DatabaseError}
   */
  deleteTaskOwnership: async (taskId) => {
    const client = await pool.connect();
    try {
      await client.query(QUERIES.TASK_OWNERSHIP.DELETE, [taskId]);
      Logger.debug('Task ownership record deleted', { taskId });
      return true;
    } catch (error) {
      Logger.error('Failed to delete task ownership record', error, { taskId });
      throw new DatabaseError('Failed to delete task ownership record', error);
    } finally {
      client.release();
    }
  },
};

export default OwnershipModel;
