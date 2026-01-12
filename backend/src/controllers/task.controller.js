import TaskModel from '../models/task.model.js';
import TeamModel from '../models/team.model.js';
import { Logger } from '../utils/logger.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';
import { validateTaskTitle, validateNumericId, validateUserId } from '../utils/validation.js';

/**
 * Create a new task
 * POST /api/tasks
 * Requires: ADMIN role
 */
export const createTask = async (req, res, next) => {
  try {
    const { title, description, assignedToUserId, teamId } = req.body;
    const assignedByUserId = req.user.userId;

    // Validate inputs - assignedToUserId is optional
    if (!title || !teamId) {
      throw new ValidationError('Title and team ID are required');
    }

    const validatedTitle = validateTaskTitle(title);
    const validatedTeamId = validateNumericId(teamId);

    // Only validate assignedToUserId if provided
    let validatedAssignedUserId = null;
    if (assignedToUserId) {
      validatedAssignedUserId = validateUserId(assignedToUserId);
    }

    Logger.debug('Creating task', {
      title: validatedTitle,
      assignedToUserId: validatedAssignedUserId,
      teamId: validatedTeamId,
      assignedByUserId,
    });

    // Create the task
    const newTask = await TaskModel.create(
      validatedTitle,
      description || null,
      validatedAssignedUserId,
      assignedByUserId,
      validatedTeamId
    );

    Logger.info('Task created successfully', {
      taskId: newTask.id,
      title: validatedTitle,
      assignedToUserId: validatedAssignedUserId,
    });

    return res.status(201).json({
      success: true,
      message: 'Task assigned successfully',
      task: newTask,
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Create task error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'TASK_CREATE_ERROR',
      message: 'Failed to create task',
    });
  }
};

/**
 * Get tasks assigned to the logged-in user
 * GET /api/tasks/my-tasks
 */
export const getTasksByAssignedUser = async (req, res, next) => {
  try {
    const assignedUserId = req.user.userId;

    Logger.debug('Fetching assigned tasks', { userId: assignedUserId });

    // Fetch tasks assigned to the user
    const tasks = await TaskModel.findByAssignedUser(assignedUserId);

    Logger.info('Tasks retrieved successfully', { userId: assignedUserId, taskCount: tasks.length });

    return res.status(200).json({
      success: true,
      message: 'Tasks retrieved successfully',
      tasks,
    });

  } catch (error) {
    Logger.error('Get assigned tasks error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'TASK_FETCH_ERROR',
      message: 'Failed to fetch tasks',
    });
  }
};

/**
 * Get tasks for a specific team
 * GET /api/tasks/team/:teamId
 */
export const getTasksByTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const requestingUserId = req.user.userId;

    // Validate team ID
    let validatedTeamId;
    try {
      validatedTeamId = validateNumericId(teamId);
    } catch (error) {
      throw new ValidationError('Invalid team ID format');
    }

    Logger.debug('Fetching team tasks', { teamId: validatedTeamId, userId: requestingUserId });

    // Fetch tasks belonging to the team
    const tasks = await TaskModel.findByTeam(validatedTeamId);

    Logger.info('Team tasks retrieved successfully', { teamId: validatedTeamId, taskCount: tasks.length });

    return res.status(200).json({
      success: true,
      message: 'Tasks for team retrieved successfully',
      tasks,
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Get team tasks error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'TASK_TEAM_FETCH_ERROR',
      message: 'Failed to fetch team tasks',
    });
  }
};

/**
 * Start a task
 * PUT /api/tasks/:id/start
 * Only the assigned user can start their task
 */
export const startTask = async (req, res, next) => {
  try {
    const { id: taskId } = req.params;
    const assignedUserId = req.user.userId;

    // Validate task ID
    let validatedTaskId;
    try {
      validatedTaskId = validateNumericId(taskId);
    } catch (error) {
      throw new ValidationError('Invalid task ID format');
    }

    Logger.debug('Starting task', { taskId: validatedTaskId, userId: assignedUserId });

    // Attempt to update the task status to 'IN_PROGRESS'
    const updatedTask = await TaskModel.updateStatusToInProgress(validatedTaskId, assignedUserId);

    if (!updatedTask) {
      Logger.warn('Cannot start task - validation failed', {
        taskId: validatedTaskId,
        userId: assignedUserId,
      });
      throw new ValidationError(
        'Cannot start task. Verify it exists, you are assigned to it, and its status is ASSIGNED.'
      );
    }

    Logger.info('Task started successfully', { taskId: validatedTaskId, userId: assignedUserId });

    return res.status(200).json({
      success: true,
      message: 'Task started successfully',
      task: updatedTask,
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Start task error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'TASK_START_ERROR',
      message: 'Failed to start task',
    });
  }
};

/**
 * Complete a task
 * PUT /api/tasks/:id/complete
 * Only the assigned user can complete their task
 */
export const completeTask = async (req, res, next) => {
  try {
    const { id: taskId } = req.params;
    const assignedUserId = req.user.userId;

    // Validate task ID
    let validatedTaskId;
    try {
      validatedTaskId = validateNumericId(taskId);
    } catch (error) {
      throw new ValidationError('Invalid task ID format');
    }

    Logger.debug('Completing task', { taskId: validatedTaskId, userId: assignedUserId });

    // Attempt to update the task status to 'COMPLETED'
    const updatedTask = await TaskModel.updateStatusToCompleted(validatedTaskId, assignedUserId);

    if (!updatedTask) {
      Logger.warn('Cannot complete task - validation failed', {
        taskId: validatedTaskId,
        userId: assignedUserId,
      });
      throw new ValidationError(
        'Cannot complete task. Verify it exists, you are assigned to it, and its status is IN_PROGRESS.'
      );
    }

    Logger.info('Task completed successfully', { taskId: validatedTaskId, userId: assignedUserId });

    return res.status(200).json({
      success: true,
      message: 'Task completed successfully',
      task: updatedTask,
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Complete task error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'TASK_COMPLETE_ERROR',
      message: 'Failed to complete task',
    });
  }
};