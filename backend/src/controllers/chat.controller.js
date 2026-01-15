import ChatModel from '../models/chat.model.js';
import TeamModel from '../models/team.model.js';
import { Logger } from '../utils/logger.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';
import { validateNumericId } from '../utils/validation.js';

/**
 * Get all messages for a team
 * GET /api/chat/:teamId
 * Query params:
 *   - limit: number of messages (default: 100)
 *   - offset: pagination offset (default: 0)
 *   - since: ISO timestamp - only return messages after this time (for polling)
 * Requires: User must be a team member
 */
export const getTeamMessages = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { limit = 100, offset = 0, since } = req.query;
    const userId = req.user.userId;

    // Validate team ID
    const validatedTeamId = validateNumericId(teamId);

    // Verify team exists
    const team = await TeamModel.findById(validatedTeamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Authorization: Check if user is a member of this team (team chat isolation)
    const isMember = await TeamModel.isMember(validatedTeamId, userId);
    if (!isMember && team.owner_id !== userId) {
      throw new AuthorizationError('You are not a member of this team');
    }

    let messages;

    // If 'since' parameter provided, fetch only new messages (polling mode)
    if (since) {
      Logger.debug('Fetching new team messages since timestamp', {
        teamId: validatedTeamId,
        userId,
        since,
        limit,
      });

      messages = await ChatModel.findByTeamSince(
        validatedTeamId,
        userId,
        since,
        parseInt(limit)
      );

      Logger.info('New team messages retrieved successfully (polling)', {
        teamId: validatedTeamId,
        messageCount: messages.length,
        userId,
        since,
      });
    } else {
      // Fetch all messages (initial load)
      Logger.debug('Fetching all team messages', {
        teamId: validatedTeamId,
        userId,
        limit,
        offset,
      });

      messages = await ChatModel.findByTeam(
        validatedTeamId,
        userId,
        parseInt(limit),
        parseInt(offset)
      );

      Logger.info('Team messages retrieved successfully', {
        teamId: validatedTeamId,
        messageCount: messages.length,
        userId,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Team messages retrieved successfully',
      data: {
        teamId: validatedTeamId,
        messages,
        count: messages.length,
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

    Logger.error('Get team messages error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'CHAT_FETCH_ERROR',
      message: 'Failed to fetch messages',
    });
  }
};

/**
 * Create a new chat message
 * POST /api/chat/:teamId
 * Body: { message: string }
 * Requires: User must be a team member
 */
export const createMessage = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { message } = req.body;
    const userId = req.user.userId;

    // Validate inputs
    if (!message || typeof message !== 'string') {
      throw new ValidationError('Message content is required and must be a string');
    }

    if (message.trim().length === 0) {
      throw new ValidationError('Message cannot be empty');
    }

    if (message.length > 5000) {
      throw new ValidationError('Message is too long (max 5000 characters)');
    }

    const validatedTeamId = validateNumericId(teamId);

    Logger.debug('Creating chat message', { teamId: validatedTeamId, userId });

    // Verify team exists
    const team = await TeamModel.findById(validatedTeamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Authorization: Check if user is a member of this team (team chat isolation)
    const isMember = await TeamModel.isMember(validatedTeamId, userId);
    if (!isMember && team.owner_id !== userId) {
      throw new AuthorizationError('You are not a member of this team');
    }

    // Create the message
    const newMessage = await ChatModel.create(validatedTeamId, userId, message.trim());

    Logger.info('Chat message created successfully', {
      messageId: newMessage.id,
      teamId: validatedTeamId,
      userId,
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage,
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Create chat message error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'CHAT_CREATE_ERROR',
      message: 'Failed to create message',
    });
  }
};

/**
 * Delete a chat message (soft delete by default)
 * DELETE /api/chat/message/:messageId
 * Query: ?hard=true for hard delete (admin only)
 */
export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { hard = false, deleteType = 'everyone' } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const validatedMessageId = validateNumericId(messageId);

    Logger.debug('Deleting chat message', { messageId: validatedMessageId, userId, hard, deleteType });

    // Get the message to verify ownership
    const messageRecord = await ChatModel.findById(validatedMessageId);
    if (!messageRecord) {
      throw new NotFoundError('Message not found');
    }

    let result;

    if (deleteType === 'me') {
      // Delete for this user only
      result = await ChatModel.deleteForUser(validatedMessageId, userId);
      Logger.info('Chat message deleted for user', { messageId: validatedMessageId, userId });

      return res.status(200).json({
        success: true,
        message: 'Message deleted for you',
        data: { ...result, deleteType: 'me' },
      });
    } else {
      // Delete for everyone - requires authorization
      if (messageRecord.user_id !== userId && userRole !== 'ADMIN') {
        throw new AuthorizationError('You can only delete your own messages for everyone');
      }

      if (hard === 'true' && userRole === 'ADMIN') {
        // Hard delete (admin only)
        result = await ChatModel.hardDelete(validatedMessageId);
        Logger.info('Chat message hard deleted', { messageId: validatedMessageId, userId });
      } else {
        // Soft delete (sender or admin)
        result = await ChatModel.softDelete(validatedMessageId);
        Logger.info('Chat message soft deleted', { messageId: validatedMessageId, userId });
      }

      return res.status(200).json({
        success: true,
        message: 'Message deleted for everyone',
        data: { ...result, deleteType: 'everyone' },
      });
    }
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Delete chat message error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'CHAT_DELETE_ERROR',
      message: 'Failed to delete message',
    });
  }
};
