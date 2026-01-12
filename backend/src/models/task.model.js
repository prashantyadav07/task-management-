import pool from '../config/db.js';
import QUERIES from '../constants/queries.js';
import { Logger } from '../utils/logger.js';
import { DatabaseError } from '../utils/errors.js';

const TaskModel = {
  /**
   * Create a new task
   * @throws {DatabaseError}
   */
  create: async (title, description, assignedToUserId, assignedByUserId, teamId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.TASK.CREATE, [
        title,
        description,
        assignedToUserId,
        assignedByUserId,
        teamId,
        'ASSIGNED',
      ]);

      Logger.debug('Task created successfully', {
        taskId: result.rows[0]?.id,
        title,
        assignedToUserId,
      });

      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to create task', error, { title, assignedToUserId });
      throw new DatabaseError('Failed to create task', error);
    } finally {
      client.release();
    }
  },

  /**
   * 🔎 Check if a user exists (ADMIN or normal user)
   */
  userExists: async (userId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT 1 FROM users WHERE id = $1 LIMIT 1',
        [userId]
      );

      return result.rowCount > 0;
    } catch (error) {
      Logger.error('Failed to check user existence', error, { userId });
      throw new DatabaseError('Failed to validate assigned user', error);
    } finally {
      client.release();
    }
  },

  /**
   * Find a task by ID
   * @throws {DatabaseError}
   */
  findById: async (id) => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.TASK.FIND_BY_ID, [id]);
      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to find task by ID', error, { taskId: id });
      throw new DatabaseError('Database query failed', error);
    } finally {
      client.release();
    }
  },

  /**
   * Find tasks assigned to a specific user
   * @throws {DatabaseError}
   */
  findByAssignedUser: async (userId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        QUERIES.TASK.FIND_BY_ASSIGNED_USER,
        [userId]
      );
      return result.rows;
    } catch (error) {
      Logger.error('Failed to fetch user tasks', error, { userId });
      throw new DatabaseError('Failed to fetch user tasks', error);
    } finally {
      client.release();
    }
  },

  /**
   * Find tasks belonging to a specific team
   * @throws {DatabaseError}
   */
  findByTeam: async (teamId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        QUERIES.TASK.FIND_BY_TEAM,
        [teamId]
      );
      return result.rows;
    } catch (error) {
      Logger.error('Failed to fetch team tasks', error, { teamId });
      throw new DatabaseError('Failed to fetch team tasks', error);
    } finally {
      client.release();
    }
  },

  /**
   * Update task status to 'IN_PROGRESS'
   * @throws {DatabaseError}
   */
  updateStatusToInProgress: async (taskId, assignedUserId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        QUERIES.TASK.UPDATE_STATUS_TO_IN_PROGRESS,
        ['IN_PROGRESS', taskId, assignedUserId, 'ASSIGNED']
      );

      Logger.debug('Task status updated to IN_PROGRESS', {
        taskId,
        userId: assignedUserId,
      });

      return result.rows[0];
    } catch (error) {
      Logger.error(
        'Failed to update task status to IN_PROGRESS',
        error,
        { taskId, userId: assignedUserId }
      );
      throw new DatabaseError('Failed to update task status', error);
    } finally {
      client.release();
    }
  },

  /**
   * Update task status to 'COMPLETED'
   * @throws {DatabaseError}
   */
  updateStatusToCompleted: async (taskId, assignedUserId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        QUERIES.TASK.UPDATE_STATUS_TO_COMPLETED,
        ['COMPLETED', taskId, assignedUserId, 'IN_PROGRESS']
      );

      Logger.debug('Task status updated to COMPLETED', {
        taskId,
        userId: assignedUserId,
      });

      return result.rows[0];
    } catch (error) {
      Logger.error(
        'Failed to update task status to COMPLETED',
        error,
        { taskId, userId: assignedUserId }
      );
      throw new DatabaseError('Failed to update task status', error);
    } finally {
      client.release();
    }
  },

  /**
   * Get the time taken for a completed task (in minutes)
   * @throws {DatabaseError}
   */
  getTaskTime: async (taskId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        QUERIES.TASK.GET_TASK_TIME,
        [taskId, 'COMPLETED']
      );

      const row = result.rows[0];

      Logger.debug('Task time calculated', {
        taskId,
        timeInMinutes: row?.time_in_minutes,
      });

      return row ? row.time_in_minutes : null;
    } catch (error) {
      Logger.error('Failed to calculate task time', error, { taskId });
      throw new DatabaseError('Failed to calculate task time', error);
    } finally {
      client.release();
    }
  },

  /**
   * Assign an existing task to a user
   * Used by admin to reassign or assign tasks to any user
   * @throws {DatabaseError}
   */
  assignToUser: async (taskId, assignedToUserId, assignedByUserId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE tasks 
         SET assigned_to_user_id = $1, assigned_by_user_id = $2, assigned_at = NOW(), status = 'ASSIGNED'
         WHERE id = $3 
         RETURNING id, title, description, assigned_to_user_id, assigned_by_user_id, team_id, status, assigned_at`,
        [assignedToUserId, assignedByUserId, taskId]
      );

      if (result.rowCount === 0) {
        throw new Error('Task not found');
      }

      Logger.debug('Task assigned to user', {
        taskId,
        assignedToUserId,
        assignedByUserId,
      });

      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to assign task to user', error, { taskId, assignedToUserId });
      throw new DatabaseError('Failed to assign task to user', error);
    } finally {
      client.release();
    }
  },

  /**
   * Assign tasks to multiple users (bulk assignment)
   * Used by admin to assign an existing task to multiple users
   * @throws {DatabaseError}
   */
  assignToMultipleUsers: async (taskId, userIds, assignedByUserId) => {
    const client = await pool.connect();
    try {
      // First, fetch the original task to get its details
      const originalTaskResult = await client.query(
        'SELECT id, title, description, team_id FROM tasks WHERE id = $1',
        [taskId]
      );

      if (originalTaskResult.rowCount === 0) {
        throw new Error('Task not found');
      }

      const originalTask = originalTaskResult.rows[0];
      const createdTasks = [];

      // Create copies of the task for each user
      for (const userId of userIds) {
        const result = await client.query(
          `INSERT INTO tasks (title, description, assigned_to_user_id, assigned_by_user_id, team_id, status)
           VALUES ($1, $2, $3, $4, $5, 'ASSIGNED')
           RETURNING id, title, description, assigned_to_user_id, assigned_by_user_id, team_id, status, assigned_at`,
          [originalTask.title, originalTask.description, userId, assignedByUserId, originalTask.team_id]
        );
        createdTasks.push(result.rows[0]);
      }

      Logger.debug('Tasks assigned to multiple users', {
        originalTaskId: taskId,
        userCount: userIds.length,
        assignedByUserId,
      });

      return createdTasks;
    } catch (error) {
      Logger.error('Failed to assign task to multiple users', error, { taskId, userCount: userIds?.length });
      throw new DatabaseError('Failed to assign task to users', error);
    } finally {
      client.release();
    }
  },
};

export default TaskModel;