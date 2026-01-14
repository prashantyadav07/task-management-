import BulkInviteModel from '../models/bulk-invite.model.js';
import InviteModel from '../models/invite.model.js';
import TeamModel from '../models/team.model.js';
import UserModel from '../models/user.model.js';
import { sendTeamInvitationEmail } from '../services/email.service.js';
import { Logger } from '../utils/logger.js';
import { ValidationError, NotFoundError, AuthorizationError, DatabaseError } from '../utils/errors.js';
import { validateEmail, validateNumericId } from '../utils/validation.js';

/**
 * Send multiple invitations to users (bulk invite)
 * POST /api/invites/bulk
 * Body: { teamId, emails: ['email1@example.com', 'email2@example.com', ...] }
 * Requires: ADMIN role or team owner/member
 */
export const sendBulkInvitation = async (req, res, next) => {
  try {
    const { teamId, emails } = req.body;
    const invitingUserId = req.user.userId;

    // Validate inputs
    if (!teamId || !emails || !Array.isArray(emails) || emails.length === 0) {
      throw new ValidationError('Team ID and non-empty email array are required');
    }

    if (emails.length > 100) {
      throw new ValidationError('Cannot invite more than 100 users at once');
    }

    let validatedTeamId;
    try {
      validatedTeamId = validateNumericId(teamId);
    } catch (error) {
      throw new ValidationError('Invalid team ID format');
    }

    // Validate and normalize emails
    const validatedEmails = [];
    for (const email of emails) {
      try {
        const validatedEmail = validateEmail(email);
        if (!validatedEmails.includes(validatedEmail)) {
          validatedEmails.push(validatedEmail);
        }
      } catch (error) {
        throw new ValidationError(`Invalid email: ${email}`);
      }
    }

    Logger.debug('Sending bulk invitation', {
      teamId: validatedTeamId,
      invitingUserId,
      emailCount: validatedEmails.length,
    });

    // Get the team
    const team = await TeamModel.findById(validatedTeamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Check authorization: admin can invite anyone, others can only invite for their own teams
    if (req.user.role !== 'ADMIN') {
      const isTeamOwner = team.owner_id === invitingUserId;
      const teamMembers = await TeamModel.findMembers(validatedTeamId);
      const isTeamMember = teamMembers.some(m => m.id === invitingUserId);

      if (!isTeamOwner && !isTeamMember) {
        throw new AuthorizationError('You can only send invitations for your own teams');
      }
    }

    // Check if invited users are already members (filter them out)
    const existingMembers = await TeamModel.findMembers(validatedTeamId);
    const alreadyMembers = [];
    const newEmails = [];

    for (const email of validatedEmails) {
      const isAlreadyMember = existingMembers.some(member => member.email === email);
      if (isAlreadyMember) {
        alreadyMembers.push(email);
      } else {
        newEmails.push(email);
      }
    }

    if (newEmails.length === 0) {
      Logger.warn('All invited users are already team members', { teamId: validatedTeamId });
      return res.status(400).json({
        success: false,
        errorCode: 'ALL_ALREADY_MEMBERS',
        message: 'All invited users are already members of this team',
        alreadyMembers,
      });
    }

    // Create bulk invitation batch
    const { batch, items } = await BulkInviteModel.createBatch(
      validatedTeamId,
      invitingUserId,
      newEmails
    );

    // Get inviting user's name for email
    const invitingUser = await UserModel.findById(invitingUserId);

    // Send invitation emails (non-blocking - don't fail if email sending fails)
    const emailResults = [];
    try {
      for (const item of items) {
        try {
          await sendTeamInvitationEmail(
            item.email,
            team.name,
            item.token,
            invitingUser?.name || 'A team member'
          );
          emailResults.push({
            email: item.email,
            sent: true,
          });
          Logger.info('Bulk invitation email sent', {
            email: item.email,
            batchId: batch.batch_id,
          });
        } catch (emailError) {
          emailResults.push({
            email: item.email,
            sent: false,
            error: emailError.message,
          });
          Logger.error('Failed to send bulk invitation email', emailError, {
            email: item.email,
            batchId: batch.batch_id,
          });
        }
      }
    } catch (error) {
      Logger.error('Error during bulk email sending', error, { batchId: batch.batch_id });
    }

    Logger.info('Bulk invitations created successfully', {
      batchId: batch.batch_id,
      teamId: validatedTeamId,
      totalInvites: newEmails.length,
      sentEmails: emailResults.filter(r => r.sent).length,
    });

    return res.status(201).json({
      success: true,
      message: 'Bulk invitations sent successfully',
      batch: {
        batchId: batch.batch_id,
        teamId: batch.team_id,
        totalInvites: batch.total_invites,
      },
      invitedEmails: newEmails,
      alreadyMembers,
      emailResults,
    });

  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Send bulk invitation error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'BULK_INVITE_ERROR',
      message: 'Failed to send bulk invitations',
    });
  }
};

/**
 * Accept a bulk invitation (via token from email link)
 * POST /api/invites/bulk/accept/:token
 * Body: { userId }
 */
export const acceptBulkInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { userId } = req.body;
    const acceptingUserId = req.user.userId;

    if (!token) {
      throw new ValidationError('Invitation token is required');
    }

    Logger.debug('Accepting bulk invitation', { token, acceptingUserId });

    // Find the bulk invite item by token
    const inviteItem = await BulkInviteModel.findItemByToken(token);
    if (!inviteItem) {
      throw new NotFoundError('Invitation not found or expired');
    }

    // Check if already accepted
    if (inviteItem.status === 'ACCEPTED') {
      throw new ValidationError('This invitation has already been accepted');
    }

    // Check if expired
    if (new Date() > new Date(inviteItem.expires_at)) {
      throw new ValidationError('This invitation has expired');
    }

    // Get the batch details
    const batch = await BulkInviteModel.findBatchById(inviteItem.batch_id);
    if (!batch) {
      throw new NotFoundError('Invitation batch not found');
    }

    // Get team details
    const team = await TeamModel.findById(batch.team_id);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Add user to team
    await TeamModel.addMember(batch.team_id, acceptingUserId);

    // Update invitation status to ACCEPTED
    await BulkInviteModel.updateItemStatus(token, 'ACCEPTED');

    // Update batch counts
    await BulkInviteModel.updateBatchCounts(batch.batch_id);

    Logger.info('Bulk invitation accepted successfully', {
      batchId: batch.batch_id,
      teamId: batch.team_id,
      acceptedBy: acceptingUserId,
      email: inviteItem.email,
    });

    return res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully',
      teamId: batch.team_id,
      teamName: team.name,
      userId: acceptingUserId,
    });

  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Accept bulk invitation error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'ACCEPT_BULK_INVITE_ERROR',
      message: 'Failed to accept invitation',
    });
  }
};

/**
 * Get batch details
 * GET /api/invites/bulk/:batchId
 */
export const getBulkBatch = async (req, res, next) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      throw new ValidationError('Batch ID is required');
    }

    Logger.debug('Fetching bulk invite batch', { batchId });

    const batch = await BulkInviteModel.findBatchById(batchId);
    if (!batch) {
      throw new NotFoundError('Batch not found');
    }

    const items = await BulkInviteModel.getBatchItems(batchId);

    Logger.info('Bulk batch retrieved successfully', { batchId, itemCount: items.length });

    return res.status(200).json({
      success: true,
      batch,
      items,
    });

  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Get bulk batch error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'BULK_BATCH_FETCH_ERROR',
      message: 'Failed to fetch batch details',
    });
  }
};
