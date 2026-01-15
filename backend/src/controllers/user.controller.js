import UserModel from '../models/user.model.js';
import TaskModel from '../models/task.model.js';
import pool from '../config/db.js';
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
/**
 * Delete a member from the platform (admin only)
 * DELETE /api/users/:userId
 * Query: ?hard=true for hard delete (default: soft delete)
 */
export const deleteMember = async (req, res, next) => {
  try {
    const { userId: memberIdToDelete } = req.params;
    const adminId = req.user.userId;
    const { hard = false } = req.query;

    // Validate user ID
    let validatedUserId;
    try {
      validatedUserId = validateUserId(memberIdToDelete);
    } catch (error) {
      throw new ValidationError('Invalid user ID format');
    }

    // Prevent admin from deleting themselves
    if (validatedUserId === adminId) {
      throw new ValidationError('You cannot delete your own admin account');
    }

    Logger.debug('Deleting member', { memberId: validatedUserId, adminId, hard });

    // Verify user exists
    const user = await UserModel.findById(validatedUserId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    let result;
    if (hard === 'true') {
      // Hard delete - permanently remove user and all associated data
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Delete user's tasks (completed_by_user_id is handled by ON DELETE SET NULL constraint)
        await client.query('DELETE FROM tasks WHERE assigned_to_user_id = $1 OR assigned_by_user_id = $1', [validatedUserId]);

        // Remove user from team members
        await client.query('DELETE FROM team_members WHERE user_id = $1', [validatedUserId]);

        // Delete chat messages
        await client.query('DELETE FROM team_chat_messages WHERE user_id = $1', [validatedUserId]);

        // Delete invites where user is invitee
        await client.query('DELETE FROM invites WHERE email = (SELECT email FROM users WHERE id = $1)', [validatedUserId]);

        // Update teams owned by user
        await client.query('DELETE FROM teams WHERE owner_id = $1', [validatedUserId]);

        // Finally delete the user
        const userResult = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [validatedUserId]);

        await client.query('COMMIT');

        result = { success: true, userId: validatedUserId, method: 'hard_delete' };
        Logger.info('User hard deleted', { userId: validatedUserId, adminId });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // Soft delete - mark user as inactive but keep data
      // Note: This assumes you add an 'is_active' or 'deleted_at' column to users table
      // For now, we'll document this requires schema update
      throw new ValidationError('Soft delete for users requires database schema update. Use ?hard=true for complete deletion.');
    }

    return res.status(200).json({
      success: true,
      message: 'Member deleted successfully',
      data: result,
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Delete member error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'MEMBER_DELETE_ERROR',
      message: 'Failed to delete member',
    });
  }
};
