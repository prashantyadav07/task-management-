import TaskModel from '../models/task.model.js';
import TeamModel from '../models/team.model.js';
import OwnershipModel from '../models/ownership.model.js';
import pool from '../config/db.js';
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
    const creatorRole = req.user.role;

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
      creatorRole,
    });

    // Create the task with ownership tracking
    const newTask = await TaskModel.create(
      validatedTitle,
      description || null,
      validatedAssignedUserId,
      assignedByUserId,
      validatedTeamId,
      creatorRole
    );

    Logger.info('Task created successfully', {
      taskId: newTask.id,
      title: validatedTitle,
      assignedToUserId: validatedAssignedUserId,
      creatorRole,
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
 * Body: { lateSubmissionReason: string (optional) }
 */
export const completeTask = async (req, res, next) => {
  try {
    const { id: taskId } = req.params;
    const { lateSubmissionReason } = req.body;
    const assignedUserId = req.user.userId;
    const completedByUserId = req.user.userId; // Person completing the task

    // Validate task ID
    let validatedTaskId;
    try {
      validatedTaskId = validateNumericId(taskId);
    } catch (error) {
      throw new ValidationError('Invalid task ID format');
    }

    Logger.debug('Completing task', { taskId: validatedTaskId, userId: assignedUserId });

    // Check if submission is late
    const lateCheckResult = await TaskModel.isLateSubmission(validatedTaskId);
    if (!lateCheckResult) {
      throw new ValidationError('Task not found');
    }

    const { is_late, due_date } = lateCheckResult;

    // If late and no reason provided, return request for reason
    if (is_late && !lateSubmissionReason) {
      Logger.info('Late submission detected - reason requested', {
        taskId: validatedTaskId,
        userId: assignedUserId,
        dueDate: due_date,
      });

      return res.status(400).json({
        success: false,
        errorCode: 'LATE_SUBMISSION_REASON_REQUIRED',
        message: 'This task is past the deadline. Please provide a reason for late submission.',
        data: {
          isLate: true,
          dueDate: due_date,
        },
      });
    }

    // Complete the task with optional reason
    const updatedTask = await TaskModel.completeWithReason(
      validatedTaskId,
      assignedUserId,
      completedByUserId,
      lateSubmissionReason || null
    );

    if (!updatedTask) {
      Logger.warn('Cannot complete task - validation failed', {
        taskId: validatedTaskId,
        userId: assignedUserId,
      });
      throw new ValidationError(
        'Cannot complete task. Verify it exists, you are assigned to it, and its status is IN_PROGRESS.'
      );
    }

    Logger.info('Task completed successfully', {
      taskId: validatedTaskId,
      userId: assignedUserId,
      isLate: is_late,
      hadReason: !!lateSubmissionReason,
    });

    return res.status(200).json({
      success: true,
      message: 'Task completed successfully',
      task: updatedTask,
      auditInfo: {
        isLateSubmission: is_late,
        dueDate: due_date,
        completedAt: updatedTask.completed_at,
        completedBy: completedByUserId,
      },
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

/**
 * Get complete task details with audit trail
 * GET /api/tasks/:id/details
 */
export const getTaskDetails = async (req, res, next) => {
  try {
    const { id: taskId } = req.params;
    const userId = req.user.userId;

    // Validate task ID
    const validatedTaskId = validateNumericId(taskId);

    Logger.debug('Fetching task details with audit trail', { taskId: validatedTaskId, userId });

    // Get task with full audit trail
    const task = await TaskModel.getWithAuditTrail(validatedTaskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    Logger.info('Task details retrieved successfully', { taskId: validatedTaskId, userId });

    // Build audit trail description
    const auditTrail = {
      created: `Task created on ${new Date(task.created_at).toLocaleDateString()} at ${new Date(task.created_at).toLocaleTimeString()}`,
      assigned: task.assigned_at ? `Assigned on ${new Date(task.assigned_at).toLocaleDateString()} at ${new Date(task.assigned_at).toLocaleTimeString()} by ${task.assigned_by_name}` : null,
      started: task.started_at ? `Started on ${new Date(task.started_at).toLocaleDateString()} at ${new Date(task.started_at).toLocaleTimeString()}` : null,
      completed: task.completed_at ? `Completed on ${new Date(task.completed_at).toLocaleDateString()} at ${new Date(task.completed_at).toLocaleTimeString()} by ${task.completed_by_name}` : null,
      isLateSubmission: task.is_late_submission,
      lateReason: task.late_submission_reason,
    };

    return res.status(200).json({
      success: true,
      message: 'Task details retrieved successfully',
      data: {
        task,
        auditTrail,
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

    Logger.error('Get task details error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'TASK_DETAIL_ERROR',
      message: 'Failed to fetch task details',
    });
  }
};

/**
 * Create a task by a member for their own team
 * POST /api/tasks/member/create
 * Members can create tasks for their own teams and assign to themselves or team members
 */
export const createMemberTask = async (req, res, next) => {
  try {
    const { title, description, assignedToUserId, teamId, dueDate } = req.body;
    const createdByUserId = req.user.userId;

    // Validate required inputs
    if (!title || !teamId) {
      throw new ValidationError('Title and team ID are required');
    }

    const validatedTitle = validateTaskTitle(title);
    const validatedTeamId = validateNumericId(teamId);

    Logger.debug('Member creating task', {
      title: validatedTitle,
      teamId: validatedTeamId,
      createdByUserId,
      assignedToUserId,
    });

    // Verify team exists and user is a member
    const team = await TeamModel.findById(validatedTeamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Verify user is owner or member of the team
    const teamMembers = await TeamModel.findMembers(validatedTeamId);
    const isMember = teamMembers.some(m => m.id === createdByUserId) || team.owner_id === createdByUserId;

    if (!isMember) {
      throw new AuthorizationError('You must be a member of this team to create tasks');
    }

    // Validate assignedToUserId if provided (no team membership check - matches admin endpoint)
    let validatedAssignedUserId = null;
    if (assignedToUserId) {
      validatedAssignedUserId = validateUserId(assignedToUserId);
    } else {
      // Default to self-assignment if not specified
      validatedAssignedUserId = createdByUserId;
    }

    // Create the task
    const newTask = await TaskModel.create(
      validatedTitle,
      description || null,
      validatedAssignedUserId,
      createdByUserId,
      validatedTeamId
    );

    // Update due date if provided
    if (dueDate) {
      const client = await pool.connect();
      try {
        await client.query(
          'UPDATE tasks SET due_date = $1 WHERE id = $2',
          [new Date(dueDate), newTask.id]
        );
      } finally {
        client.release();
      }
    }

    Logger.info('Member task created successfully', {
      taskId: newTask.id,
      title: validatedTitle,
      teamId: validatedTeamId,
      createdByUserId,
      assignedToUserId: validatedAssignedUserId,
    });

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: newTask,
    });

  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Create member task error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'TASK_CREATE_ERROR',
      message: 'Failed to create task',
    });
  }
};

/**
 * Assign a task to multiple members within the member's team
 * POST /api/tasks/member/assign-multiple
 * Members can assign tasks to their own team members
 */
export const assignTaskToTeamMembers = async (req, res, next) => {
  try {
    const { taskId, memberIds } = req.body;
    const requestingUserId = req.user.userId;

    // Validate inputs
    if (!taskId || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      throw new ValidationError('Task ID and array of member IDs are required');
    }

    const validatedTaskId = validateNumericId(taskId);
    const validatedMemberIds = memberIds.map(id => validateUserId(id));

    Logger.debug('Member assigning task to team members', {
      taskId: validatedTaskId,
      memberCount: validatedMemberIds.length,
      requestingUserId,
    });

    // Get the task
    const originalTask = await TaskModel.findById(validatedTaskId);
    if (!originalTask) {
      throw new NotFoundError('Task not found');
    }

    // Verify requesting user is owner or member of the task's team
    const team = await TeamModel.findById(originalTask.team_id);
    const teamMembers = await TeamModel.findMembers(originalTask.team_id);
    const isMember = teamMembers.some(m => m.id === requestingUserId) || team.owner_id === requestingUserId;

    if (!isMember) {
      throw new AuthorizationError('You must be a member of this team');
    }

    // Verify all members to be assigned are in the same team
    const memberTeamIds = new Set();
    for (const memberId of validatedMemberIds) {
      const isMemberInTeam = teamMembers.some(m => m.id === memberId) || team.owner_id === memberId;
      if (!isMemberInTeam) {
        throw new ValidationError(`Member ${memberId} is not part of this team`);
      }
    }

    // Assign task to multiple members
    const createdTasks = await TaskModel.assignToMultipleUsers(
      validatedTaskId,
      validatedMemberIds,
      requestingUserId
    );

    Logger.info('Task assigned to multiple team members', {
      taskId: validatedTaskId,
      memberCount: createdTasks.length,
      requestingUserId,
    });

    return res.status(201).json({
      success: true,
      message: `Task assigned to ${createdTasks.length} member(s)`,
      data: {
        assignedCount: createdTasks.length,
        tasks: createdTasks,
      },
    });

  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Assign task to team members error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'TASK_ASSIGNMENT_ERROR',
      message: 'Failed to assign task to team members',
    });
  }
};

/**
 * Delete a task (admin only)
 * DELETE /api/tasks/:id
 * Query: ?hard=true for hard delete (default: soft delete)
 */
export const deleteTask = async (req, res, next) => {
  try {
    const { id: taskId } = req.params;
    const { hard = false } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Validate task ID
    const validatedTaskId = validateNumericId(taskId);

    Logger.debug('Deleting task', { taskId: validatedTaskId, userId, userRole, hard });

    // Verify task exists
    const task = await TaskModel.findById(validatedTaskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Authorization: Check if user has permission to delete this task
    // Only admins can delete tasks
    if (userRole !== 'ADMIN') {
      throw new AuthorizationError('Only admins can delete tasks');
    }

    // Verify the admin created this task (task ownership check)
    const canDelete = await OwnershipModel.canDeleteTask(validatedTaskId, userId, userRole);
    if (!canDelete) {
      throw new AuthorizationError('You can only delete tasks you created');
    }

    let result;
    if (hard === 'true') {
      // Hard delete
      result = await TaskModel.hardDelete(validatedTaskId);
      Logger.info('Task hard deleted by admin', { taskId: validatedTaskId, adminId: userId });
    } else {
      // Soft delete
      result = await TaskModel.softDelete(validatedTaskId);
      Logger.info('Task soft deleted by admin', { taskId: validatedTaskId, adminId: userId });
    }

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: result,
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Delete task error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'TASK_DELETE_ERROR',
      message: 'Failed to delete task',
    });
  }
};