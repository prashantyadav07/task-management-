import UserModel from '../models/user.model.js';
import TaskModel from '../models/task.model.js';
import { Logger } from '../utils/logger.js';
import { ValidationError, NotFoundError, DatabaseError } from '../utils/errors.js';
import { validateNumericId, validateUserId } from '../utils/validation.js';

/**
 * Get all registered users on the platform
 * GET /api/users
 * Requires: ADMIN role
 */
export const getAllUsers = async (req, res, next) => {
  try {
    Logger.debug('Fetching all users');

    const users = await UserModel.findAll();

    Logger.info('All users retrieved successfully', { userCount: users.length });

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        count: users.length,
        users,
      },
    });

  } catch (error) {
    if (error instanceof DatabaseError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Get all users error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'USER_FETCH_ERROR',
      message: 'Failed to fetch users',
    });
  }
};

/**
 * Get user statistics (total count)
 * GET /api/users/stats/count
 * Requires: ADMIN role
 */
export const getUserStats = async (req, res, next) => {
  try {
    Logger.debug('Fetching user statistics');

    const totalUsers = await UserModel.countAll();

    Logger.info('User statistics retrieved successfully', { totalUsers });

    return res.status(200).json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        totalUsers,
      },
    });

  } catch (error) {
    if (error instanceof DatabaseError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Get user stats error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'USER_STATS_ERROR',
      message: 'Failed to fetch user statistics',
    });
  }
};

/**
 * Get details of a specific user
 * GET /api/users/:userId
 * Requires: ADMIN role
 */
export const getUserDetails = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Validate user ID
    let validatedUserId;
    try {
      validatedUserId = validateUserId(userId);
    } catch (error) {
      throw new ValidationError('Invalid user ID format');
    }

    Logger.debug('Fetching user details', { userId: validatedUserId });

    const user = await UserModel.findById(validatedUserId);

    if (!user) {
      Logger.warn('User not found', { userId: validatedUserId });
      throw new NotFoundError('User not found');
    }

    Logger.info('User details retrieved successfully', { userId: validatedUserId });

    return res.status(200).json({
      success: true,
      message: 'User details retrieved successfully',
      data: user,
    });

  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Get user details error', error, { userId: req.params?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'USER_DETAIL_ERROR',
      message: 'Failed to fetch user details',
    });
  }
};

/**
 * Assign a task to a user
 * POST /api/users/:userId/assign-task
 * Requires: ADMIN role
 * Body: { taskId: number }
 */
export const assignTaskToUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { taskId } = req.body;
    const adminUserId = req.user.userId;

    // Validate inputs
    if (!taskId) {
      throw new ValidationError('Task ID is required');
    }

    let validatedUserId;
    let validatedTaskId;
    try {
      validatedUserId = validateUserId(userId);
      validatedTaskId = validateNumericId(taskId);
    } catch (error) {
      throw new ValidationError('Invalid user ID or task ID format');
    }

    Logger.debug('Assigning task to user', {
      taskId: validatedTaskId,
      userId: validatedUserId,
      adminUserId,
    });

    // Check if user exists
    const user = await UserModel.findById(validatedUserId);
    if (!user) {
      Logger.warn('User not found for task assignment', { userId: validatedUserId });
      throw new NotFoundError('User not found');
    }

    // Check if task exists
    const task = await TaskModel.findById(validatedTaskId);
    if (!task) {
      Logger.warn('Task not found for assignment', { taskId: validatedTaskId });
      throw new NotFoundError('Task not found');
    }

    // Assign task to user
    const updatedTask = await TaskModel.assignToUser(
      validatedTaskId,
      validatedUserId,
      adminUserId
    );

    Logger.info('Task assigned to user successfully', {
      taskId: validatedTaskId,
      userId: validatedUserId,
      adminUserId,
    });

    return res.status(200).json({
      success: true,
      message: 'Task assigned to user successfully',
      data: updatedTask,
    });

  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Assign task to user error', error, { userId: req.params?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'TASK_ASSIGNMENT_ERROR',
      message: 'Failed to assign task to user',
    });
  }
};

/**
 * Assign a task to multiple users
 * POST /api/users/assign-task-bulk
 * Requires: ADMIN role
 * Body: { taskId: number, userIds: number[] }
 */
export const assignTaskToMultipleUsers = async (req, res, next) => {
  try {
    const { taskId, userIds } = req.body;
    const adminUserId = req.user.userId;

    // Validate inputs
    if (!taskId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new ValidationError('Task ID and non-empty user IDs array are required');
    }

    let validatedTaskId;
    let validatedUserIds;
    try {
      validatedTaskId = validateNumericId(taskId);
      validatedUserIds = userIds.map(id => validateUserId(id));
    } catch (error) {
      throw new ValidationError('Invalid task ID or user IDs format');
    }

    Logger.debug('Bulk assigning task to users', {
      taskId: validatedTaskId,
      userCount: validatedUserIds.length,
      adminUserId,
    });

    // Check if task exists
    const task = await TaskModel.findById(validatedTaskId);
    if (!task) {
      Logger.warn('Task not found for bulk assignment', { taskId: validatedTaskId });
      throw new NotFoundError('Task not found');
    }

    // Verify all users exist
    const userVerificationPromises = validatedUserIds.map(id => UserModel.findById(id));
    const users = await Promise.all(userVerificationPromises);

    const notFoundUserIds = validatedUserIds.filter((id, index) => !users[index]);
    if (notFoundUserIds.length > 0) {
      Logger.warn('Some users not found for task assignment', { userIds: notFoundUserIds });
      throw new NotFoundError(`Users not found: ${notFoundUserIds.join(', ')}`);
    }

    // Assign task to multiple users
    const assignedTasks = await TaskModel.assignToMultipleUsers(
      validatedTaskId,
      validatedUserIds,
      adminUserId
    );

    Logger.info('Task assigned to multiple users successfully', {
      taskId: validatedTaskId,
      userCount: validatedUserIds.length,
      adminUserId,
    });

    return res.status(201).json({
      success: true,
      message: `Task assigned to ${validatedUserIds.length} user(s) successfully`,
      data: {
        assignedCount: assignedTasks.length,
        tasks: assignedTasks,
      },
    });

  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Bulk assign task error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'BULK_TASK_ASSIGNMENT_ERROR',
      message: 'Failed to assign task to users',
    });
  }
};
