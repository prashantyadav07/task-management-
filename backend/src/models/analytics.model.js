import pool from '../config/db.js';
import QUERIES from '../constants/queries.js';
import { Logger } from '../utils/logger.js';
import { DatabaseError } from '../utils/errors.js';

const AnalyticsModel = {
  /**
   * Get overall dashboard statistics
   * @throws {DatabaseError}
   */
  getDashboardStats: async () => {
    const client = await pool.connect();
    try {
      const [totalTasks, assignedUsers, assignedTasks, inProgress, completed, completionRate] = await Promise.all([
        client.query(QUERIES.ANALYTICS.GET_TOTAL_TASKS),
        client.query(QUERIES.ANALYTICS.GET_ASSIGNED_USERS_COUNT),
        client.query(QUERIES.ANALYTICS.GET_ASSIGNED_TASKS),
        client.query(QUERIES.ANALYTICS.GET_IN_PROGRESS_TASKS, ['IN_PROGRESS']),
        client.query(QUERIES.ANALYTICS.GET_COMPLETED_TASKS, ['COMPLETED']),
        client.query(QUERIES.ANALYTICS.GET_COMPLETION_RATE),
      ]);

      Logger.debug('Dashboard statistics retrieved');

      return {
        totalTasks: parseInt(totalTasks.rows[0]?.total_tasks || 0, 10),
        assignedUsers: parseInt(assignedUsers.rows[0]?.assigned_users || 0, 10),
        assignedTasks: parseInt(assignedTasks.rows[0]?.assigned_tasks || 0, 10),
        inProgressTasks: parseInt(inProgress.rows[0]?.in_progress_tasks || 0, 10),
        completedTasks: parseInt(completed.rows[0]?.completed_tasks || 0, 10),
        completionRate: parseFloat(completionRate.rows[0]?.completion_rate_percentage || 0),
      };
    } catch (error) {
      Logger.error('Failed to retrieve dashboard statistics', error);
      throw new DatabaseError('Failed to retrieve dashboard statistics', error);
    } finally {
      client.release();
    }
  },

  /**
   * Get all tasks with user and team details (for admin dashboard)
   * @throws {DatabaseError}
   */
  getAllTasks: async () => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.ANALYTICS.GET_ALL_TASKS);

      Logger.debug('All tasks retrieved', { count: result.rowCount });

      return result.rows;
    } catch (error) {
      Logger.error('Failed to retrieve all tasks', error);
      throw new DatabaseError('Failed to retrieve all tasks', error);
    } finally {
      client.release();
    }
  },

  /**
   * Get completed tasks with timestamps and duration
   * @throws {DatabaseError}
   */
  getCompletedTasksWithTimestamps: async () => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        QUERIES.ANALYTICS.GET_COMPLETED_TASKS_WITH_TIMESTAMPS,
        ['COMPLETED']
      );

      Logger.debug('Completed tasks with timestamps retrieved', {
        count: result.rowCount,
      });

      return result.rows;
    } catch (error) {
      Logger.error('Failed to retrieve completed tasks', error);
      throw new DatabaseError('Failed to retrieve completed tasks', error);
    } finally {
      client.release();
    }
  },

  /**
   * Get recent tasks
   * @throws {DatabaseError}
   */
  getRecentTasks: async (limit = 10) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        QUERIES.ANALYTICS.GET_RECENT_TASKS,
        [limit]
      );

      Logger.debug('Recent tasks retrieved', {
        count: result.rowCount,
        limit,
      });

      return result.rows;
    } catch (error) {
      Logger.error('Failed to retrieve recent tasks', error);
      throw new DatabaseError('Failed to retrieve recent tasks', error);
    } finally {
      client.release();
    }
  },

  /**
   * Get task statistics for a specific team
   * @throws {DatabaseError}
   */
  getTeamTaskStats: async (teamId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        QUERIES.ANALYTICS.GET_TEAM_TASK_STATS,
        [teamId]
      );

      const stats = result.rows[0] || {
        total_tasks: 0,
        assigned_count: 0,
        in_progress_count: 0,
        completed_count: 0,
      };

      Logger.debug('Team task statistics retrieved', {
        teamId,
        totalTasks: stats.total_tasks,
      });

      return {
        totalTasks: parseInt(stats.total_tasks || 0, 10),
        assigned: parseInt(stats.assigned_count || 0, 10),
        inProgress: parseInt(stats.in_progress_count || 0, 10),
        completed: parseInt(stats.completed_count || 0, 10),
      };
    } catch (error) {
      Logger.error('Failed to retrieve team task statistics', error, { teamId });
      throw new DatabaseError('Failed to retrieve team task statistics', error);
    } finally {
      client.release();
    }
  },

  /**
   * Get task statistics for a specific user
   * @throws {DatabaseError}
   */
  getUserTaskStats: async (userId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        QUERIES.ANALYTICS.GET_USER_TASK_STATS,
        [userId]
      );

      const stats = result.rows[0] || {
        total_assigned: 0,
        assigned_count: 0,
        in_progress_count: 0,
        completed_count: 0,
      };

      Logger.debug('User task statistics retrieved', {
        userId,
        totalAssigned: stats.total_assigned,
      });

      return {
        totalAssigned: parseInt(stats.total_assigned || 0, 10),
        assigned: parseInt(stats.assigned_count || 0, 10),
        inProgress: parseInt(stats.in_progress_count || 0, 10),
        completed: parseInt(stats.completed_count || 0, 10),
      };
    } catch (error) {
      Logger.error('Failed to retrieve user task statistics', error, { userId });
      throw new DatabaseError('Failed to retrieve user task statistics', error);
    } finally {
      client.release();
    }
  },

  /**
   * Get average task completion time
   * @throws {DatabaseError}
   */
  getAverageCompletionTime: async () => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        QUERIES.ANALYTICS.GET_AVERAGE_COMPLETION_TIME,
        ['COMPLETED']
      );

      const avgMinutes = result.rows[0]?.avg_duration_minutes || 0;

      Logger.debug('Average completion time retrieved', {
        avgMinutes: parseFloat(avgMinutes),
      });

      return {
        averageMinutes: parseFloat(avgMinutes),
        averageHours: parseFloat((avgMinutes / 60).toFixed(2)),
        averageDays: parseFloat((avgMinutes / (60 * 24)).toFixed(2)),
      };
    } catch (error) {
      Logger.error('Failed to retrieve average completion time', error);
      throw new DatabaseError('Failed to retrieve average completion time', error);
    } finally {
      client.release();
    }
  },

  /**
   * Get completion rate statistics
   * @throws {DatabaseError}
   */
  getCompletionRate: async () => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.ANALYTICS.GET_COMPLETION_RATE);

      const stats = result.rows[0] || {
        completed_tasks: 0,
        total_tasks: 0,
        completion_rate_percentage: 0,
      };

      Logger.debug('Completion rate retrieved', {
        percentage: stats.completion_rate_percentage,
      });

      return {
        completedTasks: parseInt(stats.completed_tasks || 0, 10),
        totalTasks: parseInt(stats.total_tasks || 0, 10),
        completionRatePercentage: parseFloat(stats.completion_rate_percentage || 0),
      };
    } catch (error) {
      Logger.error('Failed to retrieve completion rate', error);
      throw new DatabaseError('Failed to retrieve completion rate', error);
    } finally {
      client.release();
    }
  },
};

export default AnalyticsModel;
