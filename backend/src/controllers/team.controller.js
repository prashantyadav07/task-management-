import TeamModel from '../models/team.model.js';
import { Logger } from '../utils/logger.js';
import { ValidationError, NotFoundError, DatabaseError } from '../utils/errors.js';
import { validateTeamName, validateNumericId } from '../utils/validation.js';

/**
 * Create a new team
 * POST /api/teams
 * Requires: ADMIN role
 */
export const createTeam = async (req, res, next) => {
  try {
    const { name } = req.body;
    const ownerId = req.user.userId;

    if (!name) {
      throw new ValidationError('Team name is required');
    }

    const validatedName = validateTeamName(name);

    Logger.debug('Creating team', { ownerId, teamName: validatedName });

    // Create the team with the authenticated user as the owner
    const newTeam = await TeamModel.create(validatedName, ownerId);

    Logger.info('Team created successfully', { teamId: newTeam.id, ownerId, name: validatedName });

    return res.status(201).json({
      success: true,
      message: 'Team created successfully',
      team: newTeam,
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Create team error', error, { userId: req.user?.userId });
    return res.status(500).json({
      success: false,
      errorCode: 'TEAM_CREATE_ERROR',
      message: 'Failed to create team',
    });
  }
};

/**
 * Get all teams for the logged-in user
 * GET /api/teams
 */
export const getTeamsForUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    Logger.debug('Fetching teams for user', { userId });

    // Fetch teams where the user is a member or owner
    const teams = await TeamModel.findAllTeamsForUser(userId);

    Logger.info('Teams retrieved successfully', { userId, teamCount: teams.length });

    return res.status(200).json({
      success: true,
      message: 'Teams retrieved successfully',
      teams,
    });

  } catch (error) {
    Logger.error('Get teams error', error, { userId: req.user?.userId });
    return res.status(500).json({
      success: false,
      errorCode: 'TEAM_FETCH_ERROR',
      message: 'Failed to fetch teams',
    });
  }
};

/**
 * Get members of a specific team
 * GET /api/teams/:id/members
 */
export const getTeamMembers = async (req, res, next) => {
  try {
    const { id: teamId } = req.params;
    const requestingUserId = req.user.userId;

    // Validate team ID
    let validatedTeamId;
    try {
      validatedTeamId = validateNumericId(teamId);
    } catch (error) {
      throw new ValidationError('Invalid team ID format');
    }

    Logger.debug('Fetching team members', { teamId: validatedTeamId, requestingUserId });

    // Check if team exists
    const team = await TeamModel.findById(validatedTeamId);
    if (!team) {
      throw new NotFoundError('Team');
    }

    // Fetch members of the specified team
    const members = await TeamModel.findMembers(validatedTeamId);

    Logger.info('Team members retrieved successfully', { teamId: validatedTeamId, memberCount: members.length });

    return res.status(200).json({
      success: true,
      message: 'Team members retrieved successfully',
      members,
    });

  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Get team members error', error, { userId: req.user?.userId });
    return res.status(500).json({
      success: false,
      errorCode: 'TEAM_MEMBERS_ERROR',
      message: 'Failed to fetch team members',
    });
  }
};

/**
 * Add a member to a team
 * POST /api/teams/:id/members
 * Requires: ADMIN role
 * Body: { userId: string }
 */
export const addMemberToTeam = async (req, res, next) => {
  try {
    const { id: teamId } = req.params;
    const { userId } = req.body;

    // Validate inputs
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    let validatedTeamId;
    try {
      validatedTeamId = validateNumericId(teamId);
    } catch (error) {
      throw new ValidationError('Invalid team ID format');
    }

    Logger.debug('Adding member to team', { teamId: validatedTeamId, userId });

    // Check if team exists
    const team = await TeamModel.findById(validatedTeamId);
    if (!team) {
      throw new NotFoundError('Team');
    }

    // Check if user is already a member
    const isMember = await TeamModel.isMember(validatedTeamId, userId);
    if (isMember) {
      return res.status(400).json({
        success: false,
        errorCode: 'ALREADY_MEMBER',
        message: 'User is already a member of this team',
      });
    }

    // Add member to team
    await TeamModel.addMember(validatedTeamId, userId);

    Logger.info('Member added to team successfully', { teamId: validatedTeamId, userId });

    return res.status(201).json({
      success: true,
      message: 'Member added to team successfully',
    });

  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Add member to team error', error, { userId: req.user?.userId });
    return res.status(500).json({
      success: false,
      errorCode: 'ADD_MEMBER_ERROR',
      message: 'Failed to add member to team',
    });
  }
};