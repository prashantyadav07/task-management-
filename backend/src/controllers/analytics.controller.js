import AnalyticsModel from '../models/analytics.model.js';
import { Logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { validateNumericId } from '../utils/validation.js';

/**
 * Get overall dashboard statistics
 * GET /api/analytics/dashboard
 * Requires: ADMIN role
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    Logger.debug('Fetching dashboard statistics');

    const stats = await AnalyticsModel.getDashboardStats();

    Logger.info('Dashboard statistics retrieved successfully');

    return res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    Logger.error('Get dashboard stats error', error, {
      userId: req.user?.userId,
    });

    res.status(500).json({
      success: false,
      errorCode: 'ANALYTICS_ERROR',
      message: 'Failed to retrieve dashboard statistics',
    });
  }
};

/**
 * Get completed tasks with timestamps
 * GET /api/analytics/completed-tasks
 * Requires: ADMIN role
 */
export const getCompletedTasks = async (req, res, next) => {
  try {
    Logger.debug('Fetching completed tasks with timestamps');

    const tasks = await AnalyticsModel.getCompletedTasksWithTimestamps();

    Logger.info('Completed tasks retrieved successfully', { count: tasks.length });

    return res.status(200).json({
      success: true,
      message: 'Completed tasks retrieved successfully',
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    Logger.error('Get completed tasks error', error, {
      userId: req.user?.userId,
    });

    res.status(500).json({
      success: false,
      errorCode: 'ANALYTICS_ERROR',
      message: 'Failed to retrieve completed tasks',
    });
  }
};

/**
 * Get recent tasks
 * GET /api/analytics/recent-tasks?limit=10
 */
export const getRecentTasks = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    // Validate limit parameter
    const validatedLimit = Math.min(parseInt(limit, 10) || 10, 100);

    Logger.debug('Fetching recent tasks', { limit: validatedLimit });

    const tasks = await AnalyticsModel.getRecentTasks(validatedLimit);

    Logger.info('Recent tasks retrieved successfully', { count: tasks.length });

    return res.status(200).json({
      success: true,
      message: 'Recent tasks retrieved successfully',
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    Logger.error('Get recent tasks error', error, {
      userId: req.user?.userId,
    });

    res.status(500).json({
      success: false,
      errorCode: 'ANALYTICS_ERROR',
      message: 'Failed to retrieve recent tasks',
    });
  }
};

/**
 * Get team task statistics
 * GET /api/analytics/team/:teamId
 * Requires: User must be a team member or admin
 */
export const getTeamStats = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    // Validate team ID
    const validatedTeamId = validateNumericId(teamId);

    Logger.debug('Fetching team task statistics', { teamId: validatedTeamId });

    const stats = await AnalyticsModel.getTeamTaskStats(validatedTeamId);

    Logger.info('Team statistics retrieved successfully', {
      teamId: validatedTeamId,
    });

    return res.status(200).json({
      success: true,
      message: 'Team statistics retrieved successfully',
      teamId: validatedTeamId,
      data: stats,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Get team stats error', error, {
      userId: req.user?.userId,
      teamId: req.params.teamId,
    });

    res.status(500).json({
      success: false,
      errorCode: 'ANALYTICS_ERROR',
      message: 'Failed to retrieve team statistics',
    });
  }
};

/**
 * Get user task statistics
 * GET /api/analytics/user/:userId
 * Requires: ADMIN or the user themselves
 */
export const getUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Validate user ID
    const validatedUserId = validateNumericId(userId);

    Logger.debug('Fetching user task statistics', { userId: validatedUserId });

    const stats = await AnalyticsModel.getUserTaskStats(validatedUserId);

    Logger.info('User statistics retrieved successfully', {
      userId: validatedUserId,
    });

    return res.status(200).json({
      success: true,
      message: 'User statistics retrieved successfully',
      userId: validatedUserId,
      data: stats,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Get user stats error', error, {
      userId: req.user?.userId,
      targetUserId: req.params.userId,
    });

    res.status(500).json({
      success: false,
      errorCode: 'ANALYTICS_ERROR',
      message: 'Failed to retrieve user statistics',
    });
  }
};

/**
 * Get average task completion time
 * GET /api/analytics/completion-time
 * Requires: ADMIN role
 */
export const getCompletionTime = async (req, res, next) => {
  try {
    Logger.debug('Fetching average task completion time');

    const timeStats = await AnalyticsModel.getAverageCompletionTime();

    Logger.info('Average completion time retrieved successfully');

    return res.status(200).json({
      success: true,
      message: 'Average task completion time retrieved successfully',
      data: timeStats,
    });
  } catch (error) {
    Logger.error('Get completion time error', error, {
      userId: req.user?.userId,
    });

    res.status(500).json({
      success: false,
      errorCode: 'ANALYTICS_ERROR',
      message: 'Failed to retrieve completion time statistics',
    });
  }
};

/**
 * Get task completion rate
 * GET /api/analytics/completion-rate
 * Requires: ADMIN role
 */
export const getCompletionRateStats = async (req, res, next) => {
  try {
    Logger.debug('Fetching task completion rate');

    const rateStats = await AnalyticsModel.getCompletionRate();

    Logger.info('Completion rate retrieved successfully');

    return res.status(200).json({
      success: true,
      message: 'Task completion rate retrieved successfully',
      data: rateStats,
    });
  } catch (error) {
    Logger.error('Get completion rate error', error, {
      userId: req.user?.userId,
    });

    res.status(500).json({
      success: false,
      errorCode: 'ANALYTICS_ERROR',
      message: 'Failed to retrieve completion rate statistics',
    });
  }
};
