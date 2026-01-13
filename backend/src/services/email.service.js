import nodemailer from 'nodemailer';
import { Logger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Service
 * Handles sending emails for the application using Gmail SMTP
 */

// Create reusable transporter with Gmail SMTP
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    Logger.warn('Email credentials not configured - emails will be logged only');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
};

const transporter = createTransporter();

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
    // If transporter is not configured, just log the email
    if (!transporter) {
      Logger.info(`[DEV MODE] Email would be sent to: ${to}`);
      Logger.info(`[DEV MODE] Subject: ${subject}`);
      Logger.info(`[DEV MODE] Body: ${text}`);
      return true;
    }

    const mailOptions = {
      from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    Logger.info(`Email sent successfully: ${info.messageId} to ${to}`);
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Team Invitation</h2>
        <p>You have been invited to join the team <strong>${teamName}</strong>.</p>
        <p style="margin: 24px 0;">
          <a href="${inviteUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
        </p>
        <p style="color: #666; font-size: 14px;">Or copy this link: ${inviteUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #999; font-size: 12px;">This is an automated email from TaskFlow.</p>
      </div>
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Password Reset</h2>
        <p>You requested a password reset.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </p>
        <p style="color: #666; font-size: 14px;">Or copy this link: ${resetUrl}</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Team Invitation</h2>
        <p>You have been invited to join a team.</p>
        <p style="margin: 24px 0;">
          <a href="${inviteUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
        </p>
        <p style="color: #666; font-size: 14px;">Or copy this link: ${inviteUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #999; font-size: 12px;">This is an automated email from TaskFlow.</p>
      </div>
    `
  });
};

export default {
  sendEmail,
  sendInvitationEmail,
  sendPasswordResetEmail,
  sendInviteEmail
};