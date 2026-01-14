import pool from '../config/db.js';
import QUERIES from '../constants/queries.js';
import { Logger } from '../utils/logger.js';
import { DatabaseError } from '../utils/errors.js';

const TaskModel = {
  /**
   * Create a new task with ownership tracking
   * @param {string} title - Task title
   * @param {string} description - Task description
   * @param {number} assignedToUserId - User ID to assign the task to
   * @param {number} assignedByUserId - User ID creating/assigning the task
   * @param {number} teamId - Team ID for the task
   * @param {string} [creatorRole='MEMBER'] - Role of the task creator
   * @throws {DatabaseError}
   */
  create: async (title, description, assignedToUserId, assignedByUserId, teamId, creatorRole = 'MEMBER') => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(QUERIES.TASK.CREATE, [
        title,
        description,
        assignedToUserId,
        assignedByUserId,
        teamId,
        'ASSIGNED',
      ]);

      const task = result.rows[0];

      // Track ownership for delete permissions
      await client.query(QUERIES.TASK_OWNERSHIP.CREATE, [task.id, assignedByUserId, creatorRole]);

      await client.query('COMMIT');

      Logger.debug('Task created successfully', {
        taskId: task.id,
        title,
        assignedToUserId,
        creatorRole,
      });

      return task;
    } catch (error) {
      await client.query('ROLLBACK');
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

  /**
   * Assign a task to an entire team
   * Creates copies of the task for all team members
   * @throws {DatabaseError}
   */
  assignToTeam: async (taskId, teamId, assignedByUserId) => {
    const client = await pool.connect();
    try {
      // Fetch the original task
      const originalTaskResult = await client.query(
        'SELECT id, title, description, team_id FROM tasks WHERE id = $1',
        [taskId]
      );

      if (originalTaskResult.rowCount === 0) {
        throw new Error('Task not found');
      }

      const originalTask = originalTaskResult.rows[0];

      // Get all team members
      const teamMembersResult = await client.query(
        'SELECT user_id FROM team_members WHERE team_id = $1',
        [teamId]
      );

      const memberIds = teamMembersResult.rows.map(row => row.user_id);
      const createdTasks = [];

      // Create copies for each team member
      for (const memberId of memberIds) {
        const result = await client.query(
          `INSERT INTO tasks (title, description, assigned_to_user_id, assigned_by_user_id, team_id, status)
           VALUES ($1, $2, $3, $4, $5, 'ASSIGNED')
           RETURNING id, title, description, assigned_to_user_id, assigned_by_user_id, team_id, status, assigned_at`,
          [originalTask.title, originalTask.description, memberId, assignedByUserId, teamId]
        );
        createdTasks.push(result.rows[0]);
      }

      Logger.debug('Tasks assigned to entire team', {
        originalTaskId: taskId,
        teamId,
        memberCount: memberIds.length,
        assignedByUserId,
      });

      return createdTasks;
    } catch (error) {
      Logger.error('Failed to assign task to team', error, { taskId, teamId });
      throw new DatabaseError('Failed to assign task to team', error);
    } finally {
      client.release();
    }
  },

  /**
   * Complete a task with optional late submission reason
   * @throws {DatabaseError}
   */
  completeWithReason: async (taskId, assignedUserId, completedByUserId, lateReason = null) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE tasks 
         SET status = $1, completed_at = NOW(), completed_by_user_id = $2, late_submission_reason = $3
         WHERE id = $4 AND assigned_to_user_id = $5 AND status = $6
         RETURNING *`,
        ['COMPLETED', completedByUserId, lateReason, taskId, assignedUserId, 'IN_PROGRESS']
      );

      if (result.rowCount === 0) {
        throw new Error('Task not found or not in IN_PROGRESS status');
      }

      Logger.debug('Task completed with reason', {
        taskId,
        userId: assignedUserId,
        completedBy: completedByUserId,
        hasReason: !!lateReason,
      });

      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to complete task with reason', error, { taskId, assignedUserId });
      throw new DatabaseError('Failed to complete task', error);
    } finally {
      client.release();
    }
  },

  /**
   * Get task with full audit trail
   * Returns task details with user names and timeline information
   * @throws {DatabaseError}
   */
  getWithAuditTrail: async (taskId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.assigned_to_user_id,
          t.assigned_by_user_id,
          t.completed_by_user_id,
          t.team_id,
          t.assigned_at,
          t.started_at,
          t.completed_at,
          t.due_date,
          t.late_submission_reason,
          t.created_at,
          t.updated_at,
          u_assigned_to.name as assigned_to_name,
          u_assigned_to.email as assigned_to_email,
          u_assigned_by.name as assigned_by_name,
          u_assigned_by.email as assigned_by_email,
          u_completed_by.name as completed_by_name,
          u_completed_by.email as completed_by_email,
          tm.name as team_name,
          CASE 
            WHEN t.due_date IS NOT NULL AND t.completed_at > t.due_date THEN TRUE
            ELSE FALSE
          END as is_late_submission
         FROM tasks t
         LEFT JOIN users u_assigned_to ON t.assigned_to_user_id = u_assigned_to.id
         LEFT JOIN users u_assigned_by ON t.assigned_by_user_id = u_assigned_by.id
         LEFT JOIN users u_completed_by ON t.completed_by_user_id = u_completed_by.id
         LEFT JOIN teams tm ON t.team_id = tm.id
         WHERE t.id = $1`,
        [taskId]
      );

      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to get task with audit trail', error, { taskId });
      throw new DatabaseError('Database query failed', error);
    } finally {
      client.release();
    }
  },

  /**
   * Check if a task is late (past due date)
   * @throws {DatabaseError}
   */
  isLateSubmission: async (taskId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          CASE 
            WHEN due_date IS NOT NULL AND NOW() > due_date THEN TRUE
            ELSE FALSE
          END as is_late,
          due_date,
          NOW() as current_time
         FROM tasks WHERE id = $1`,
        [taskId]
      );

      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to check if task is late', error, { taskId });
      throw new DatabaseError('Database query failed', error);
    } finally {
      client.release();
    }
  },

  /**
   * Soft delete a task (for admin operations)
   * @throws {DatabaseError}
   */
  softDelete: async (taskId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE tasks 
         SET is_deleted = TRUE, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [taskId]
      );

      if (result.rowCount === 0) {
        throw new Error('Task not found');
      }

      Logger.debug('Task soft deleted', { taskId });
      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to soft delete task', error, { taskId });
      throw new DatabaseError('Failed to delete task', error);
    } finally {
      client.release();
    }
  },

  /**
   * Hard delete a task (permanent deletion)
   * Use only for admin operations
   * @throws {DatabaseError}
   */
  hardDelete: async (taskId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM tasks WHERE id = $1 RETURNING id`,
        [taskId]
      );

      if (result.rowCount === 0) {
        throw new Error('Task not found');
      }

      Logger.debug('Task hard deleted', { taskId });
      return { success: true, taskId };
    } catch (error) {
      Logger.error('Failed to hard delete task', error, { taskId });
      throw new DatabaseError('Failed to delete task', error);
    } finally {
      client.release();
    }
  },
};

export default TaskModel;