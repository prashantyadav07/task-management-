import InviteModel from '../models/invite.model.js';
import TeamModel from '../models/team.model.js';
import UserModel from '../models/user.model.js';
import { sendInvitationEmail, sendTeamInvitationEmail } from '../services/email.service.js';
import { Logger } from '../utils/logger.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';
import { validateEmail, validateNumericId } from '../utils/validation.js';

/**
 * Send an invitation to a user
 * POST /api/invites
 * Requires: ADMIN role or team owner/member for their own teams
 */
export const sendInvitation = async (req, res, next) => {
  try {
    const { email, teamId } = req.body;
    const invitingUserId = req.user.userId;

    // Validate inputs
    if (!email || !teamId) {
      throw new ValidationError('Email and Team ID are required');
    }

    const validatedEmail = validateEmail(email);
    let validatedTeamId;
    try {
      validatedTeamId = validateNumericId(teamId);
    } catch (error) {
      throw new ValidationError('Invalid team ID format');
    }

    Logger.debug('Sending invitation', { email: validatedEmail, teamId: validatedTeamId, invitingUserId });

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

    // Check if the user is already a member of the team
    const existingMembers = await TeamModel.findMembers(validatedTeamId);
    const isAlreadyMember = existingMembers.some(member => member.email === validatedEmail);

    if (isAlreadyMember) {
      Logger.warn('User already member of team', { email: validatedEmail, teamId: validatedTeamId });
      throw new ValidationError('User is already a member of this team');
    }

    // Create the invitation record in the database
    const newInvite = await InviteModel.create(validatedEmail, validatedTeamId);

    // Get inviting user's name
    const invitingUser = await UserModel.findById(invitingUserId);

    // Attempt to send the invitation email (non-blocking)
    try {
      // Use enhanced team invitation email with user name
      await sendTeamInvitationEmail(
        validatedEmail,
        team.name,
        newInvite.token,
        invitingUser?.name || 'A team member'
      );
      Logger.info('Invitation email sent successfully', { email: validatedEmail, teamId: validatedTeamId });
    } catch (emailError) {
      Logger.error('Failed to send invitation email', emailError, { email: validatedEmail });
      // Don't fail the API response if email sending fails
      // The invitation record was created successfully
    }

    Logger.info('Invitation created successfully', {
      inviteId: newInvite.id,
      email: validatedEmail,
      teamId: validatedTeamId,
    });

    return res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      invite: {
        email: newInvite.email,
        teamId: newInvite.team_id,
        expiresAt: newInvite.expires_at,
        // Note: token is NOT exposed in response for security
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

    Logger.error('Send invitation error', error, { userId: req.user?.userId });
    res.status(500).json({
      success: false,
      errorCode: 'INVITE_SEND_ERROR',
      message: 'Failed to send invitation',
    });
  }
};