import { Logger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Service
 * Handles sending emails for the application (invitations, notifications, etc.)
 */

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body (optional)
 * @returns {Promise<boolean>} - Success status
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // In development, just log the email
    if (process.env.NODE_ENV !== 'production') {
      Logger.info(`Email would be sent to: ${to}`);
      Logger.info(`Subject: ${subject}`);
      Logger.info(`Body: ${text}`);
      return true;
    }

    // TODO: Implement actual email sending with a service like:
    // - Nodemailer with SMTP
    // - SendGrid
    // - AWS SES
    // - Mailgun

    Logger.info(`Email sent to: ${to}`);
    return true;
  } catch (error) {
    Logger.error('Failed to send email', error);
    return false;
  }
};

/**
 * Send invitation email
 * @param {string} email - Recipient email
 * @param {string} inviteToken - Invitation token
 * @param {string} teamName - Name of the team
 * @returns {Promise<boolean>} - Success status
 */
export const sendInvitationEmail = async (email, inviteToken, teamName) => {
  const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${inviteToken}`;

  return sendEmail({
    to: email,
    subject: `You've been invited to join ${teamName}`,
    text: `You have been invited to join the team "${teamName}". Click the link to accept: ${inviteUrl}`,
    html: `
      <h2>Team Invitation</h2>
      <p>You have been invited to join the team <strong>${teamName}</strong>.</p>
      <p><a href="${inviteUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
      <p>Or copy this link: ${inviteUrl}</p>
    `
  });
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token
 * @returns {Promise<boolean>} - Success status
 */
export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  return sendEmail({
    to: email,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Click the link to reset your password: ${resetUrl}`,
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset.</p>
      <p><a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>Or copy this link: ${resetUrl}</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  });
};

/**
 * Send invitation email with full invite URL
 * @param {string} email - Recipient email
 * @param {string} inviteUrl - Full invitation URL 
 * @returns {Promise<boolean>} - Success status
 */
export const sendInviteEmail = async (email, inviteUrl) => {
  return sendEmail({
    to: email,
    subject: `You've been invited to join a team`,
    text: `You have been invited to join a team. Click the link to accept: ${inviteUrl}`,
    html: `
      <h2>Team Invitation</h2>
      <p>You have been invited to join a team.</p>
      <p><a href="${inviteUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
      <p>Or copy this link: ${inviteUrl}</p>
    `
  });
};

export default {
  sendEmail,
  sendInvitationEmail,
  sendPasswordResetEmail,
  sendInviteEmail
};