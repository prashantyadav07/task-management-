import InviteModel from '../models/invite.model.js';
import TeamModel from '../models/team.model.js';
import { sendInvitationEmail } from '../services/email.service.js';
import { Logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { validateEmail, validateNumericId } from '../utils/validation.js';

/**
 * Send an invitation to a user
 * POST /api/invites
 * Requires: ADMIN role
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

    // Check if the user is already a member of the team
    const existingMembers = await TeamModel.findMembers(validatedTeamId);
    const isAlreadyMember = existingMembers.some(member => member.email === validatedEmail);

    if (isAlreadyMember) {
      Logger.warn('User already member of team', { email: validatedEmail, teamId: validatedTeamId });
      throw new ValidationError('User is already a member of this team');
    }

    // Create the invitation record in the database
    const newInvite = await InviteModel.create(validatedEmail, validatedTeamId);

    // Get the team name for the email
    const team = await TeamModel.findById(validatedTeamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Attempt to send the invitation email (non-blocking)
    try {
      // Pass token instead of full URL - email service will construct the URL
      await sendInvitationEmail(validatedEmail, newInvite.token, team.name);
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
    if (error instanceof ValidationError) {
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