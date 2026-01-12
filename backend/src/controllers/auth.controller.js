import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import UserModel from '../models/user.model.js';
import InviteModel from '../models/invite.model.js';
import TeamModel from '../models/team.model.js';
import { Logger } from '../utils/logger.js';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  DatabaseError,
} from '../utils/errors.js';
import {
  validateEmail,
  validatePassword,
  validateUserName,
} from '../utils/validation.js';

dotenv.config();

// Verify JWT_SECRET is set
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  Logger.error('CRITICAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

/**
 * User Login
 * POST /api/auth/login
 * Supports login for all users including admin (stored in database)
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const validatedEmail = validateEmail(email);

    Logger.debug('Login attempt', { email: validatedEmail });

    // Check regular user database
    const user = await UserModel.findByEmail(validatedEmail);
    if (!user) {
      Logger.warn('Login attempt with non-existent email', { email: validatedEmail });
      throw new AuthenticationError('Invalid email or password');
    }

    // Compare password hash for user
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      Logger.warn('Login attempt with invalid password', { userId: user.id, email: validatedEmail });
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate JWT token for user (works for both regular users and admin)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    Logger.info('User logged in successfully', { userId: user.id, email: user.email, role: user.role });

    // Return success response with token (excluding sensitive data)
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

  } catch (error) {
    if (error instanceof ValidationError || error instanceof AuthenticationError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Login error', error, { ip: req.ip });
    res.status(500).json({
      success: false,
      errorCode: 'LOGIN_ERROR',
      message: 'An error occurred during login',
    });
  }
};

/**
 * Normal Public Signup
 * POST /api/auth/signup
 * Users can sign up directly without an invitation
 * New users are created as normal members (MEMBER role) and are NOT added to any team
 */
export const signup = async (req, res, next) => {
  try {
    const { email, name, password } = req.body;

    // Validate inputs
    if (!email || !name || !password) {
      throw new ValidationError('Email, name, and password are required');
    }

    const validatedEmail = validateEmail(email);
    const validatedName = validateUserName(name);
    const validatedPassword = validatePassword(password);

    Logger.debug('Public signup attempt', { email: validatedEmail });

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(validatedEmail);
    if (existingUser) {
      Logger.warn('Signup attempt with existing email', { email: validatedEmail });
      throw new ValidationError('User with this email already exists');
    }

    // Hash the user's password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(validatedPassword, saltRounds);

    // Create new user as MEMBER (not assigned to any team)
    const newUser = await UserModel.create(validatedName, validatedEmail, hashedPassword, 'MEMBER');

    Logger.info('New user registered successfully', { userId: newUser.id, email: validatedEmail });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'Signup successful',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
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

    // CRITICAL FIX #1: Handle duplicate email error from database
    // Check for PostgreSQL unique constraint violation (error code 23505)
    if (error.code === '23505' && error.constraint === 'users_email_key') {
      Logger.warn('Duplicate email during signup', { email: req.body.email });
      return res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'User with this email already exists',
      });
    }

    Logger.error('Signup error', error, { ip: req.ip });
    res.status(500).json({
      success: false,
      errorCode: 'SIGNUP_ERROR',
      message: 'An error occurred during signup',
    });
  }
};

/**
 * Signup via Invitation
 * POST /api/auth/signup-via-invite
 */
export const signupViaInvite = async (req, res, next) => {
  try {
    const { token: inviteToken, name, password } = req.body;

    // Validate inputs
    if (!inviteToken || !name || !password) {
      throw new ValidationError('Invitation token, name, and password are required');
    }

    const validatedName = validateUserName(name);
    const validatedPassword = validatePassword(password);

    Logger.debug('Signup via invite attempt', { token: inviteToken?.substring(0, 8) + '...' });

    // Verify the invitation token
    const invite = await InviteModel.findByToken(inviteToken);
    if (!invite || invite.status !== 'PENDING') {
      Logger.warn('Invalid or already used invitation token', { token: inviteToken?.substring(0, 8) + '...' });
      throw new ValidationError('Invalid or already used invitation token');
    }

    // Check if invitation has expired
    if (new Date() > new Date(invite.expires_at)) {
      Logger.warn('Expired invitation token used', { token: inviteToken?.substring(0, 8) + '...', expiresAt: invite.expires_at });
      throw new ValidationError('Invitation token has expired');
    }

    // Hash the user's password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(validatedPassword, saltRounds);

    // Check if a user with the invited email already exists
    const existingUser = await UserModel.findByEmail(invite.email);
    if (existingUser) {
      Logger.info('Existing user added to team via invitation', {
        userId: existingUser.id,
        teamId: invite.team_id,
        email: invite.email,
      });

      // Add existing user to the team
      await TeamModel.addMember(invite.team_id, existingUser.id);
      await InviteModel.updateStatusUsed(invite.id);

      // Generate JWT token
      const token = jwt.sign(
        { userId: existingUser.id, email: existingUser.email, role: existingUser.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: true,
        message: 'Existing user added to team successfully',
        token,
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
        },
      });
    }

    // Create the new user
    const newUser = await UserModel.create(validatedName, invite.email, hashedPassword, 'MEMBER');

    Logger.info('New user created via invitation', {
      userId: newUser.id,
      email: newUser.email,
      teamId: invite.team_id,
    });

    // Add the new user to the team
    await TeamModel.addMember(invite.team_id, newUser.id);
    await InviteModel.updateStatusUsed(invite.id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'User registered and added to team successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
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

    Logger.error('Signup via invite error', error, { ip: req.ip });
    res.status(500).json({
      success: false,
      errorCode: 'SIGNUP_ERROR',
      message: 'An error occurred during registration',
    });
  }
};

/**
 * Verify Invitation Token
 * POST /api/auth/verify-invite
 * Validates the invitation token and checks if the user already exists
 * Used by frontend to determine signup flow (direct vs new account)
 */
export const verifyInvite = async (req, res, next) => {
  try {
    const { token: inviteToken } = req.body;

    // Validate input
    if (!inviteToken) {
      throw new ValidationError('Invitation token is required');
    }

    Logger.debug('Verify invite attempt', { token: inviteToken?.substring(0, 8) + '...' });

    // Find the invitation by token
    const invite = await InviteModel.findByToken(inviteToken);
    if (!invite || invite.status !== 'PENDING') {
      Logger.warn('Invalid or already used invitation token', { token: inviteToken?.substring(0, 8) + '...' });
      throw new ValidationError('Invalid or already used invitation token');
    }

    // Check if invitation has expired
    if (new Date() > new Date(invite.expires_at)) {
      Logger.warn('Expired invitation token used', { token: inviteToken?.substring(0, 8) + '...', expiresAt: invite.expires_at });
      throw new ValidationError('Invitation token has expired');
    }

    // Check if a user with the invited email already exists
    const existingUser = await UserModel.findByEmail(invite.email);
    const userExists = !!existingUser;

    Logger.debug('Invite token verified', {
      inviteId: invite.id,
      email: invite.email,
      teamId: invite.team_id,
      userExists,
    });

    return res.status(200).json({
      success: true,
      message: 'Invitation token is valid',
      invite: {
        token: inviteToken,
        email: invite.email,
        teamId: invite.team_id,
        expiresAt: invite.expires_at,
      },
      userExists, // Frontend uses this to decide signup flow
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        errorCode: error.errorCode,
        message: error.message,
      });
    }

    Logger.error('Verify invite error', error, { ip: req.ip });
    res.status(500).json({
      success: false,
      errorCode: 'VERIFY_INVITE_ERROR',
      message: 'An error occurred while verifying the invitation',
    });
  }
};