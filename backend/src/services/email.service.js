import nodemailer from 'nodemailer';
import { Logger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Service
 * Handles sending emails for the application using Gmail SMTP
 */

// Log email configuration status on startup
Logger.info('=== Email Service Configuration ===');
Logger.info(`EMAIL_USER configured: ${process.env.EMAIL_USER ? 'YES (' + process.env.EMAIL_USER + ')' : 'NO'}`);
Logger.info(`EMAIL_APP_PASSWORD configured: ${process.env.EMAIL_APP_PASSWORD ? 'YES (hidden)' : 'NO'}`);

// Create reusable transporter with Gmail SMTP
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    Logger.warn('⚠️  Email credentials NOT configured - emails will be logged only (not sent)');
    Logger.warn('⚠️  Set EMAIL_USER and EMAIL_APP_PASSWORD environment variables to enable real emails');
    return null;
  }

  Logger.info('✅ Email transporter created with Gmail SMTP');
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
  const startTime = Date.now();
  Logger.info(`📧 [STEP 1] Starting email send to: ${to}`);
  Logger.info(`📧 [STEP 2] Subject: ${subject}`);

  try {
    // If transporter is not configured, just log the email
    if (!transporter) {
      Logger.warn(`⚠️  [NO TRANSPORTER] Email NOT sent - credentials not configured`);
      Logger.info(`📧 [MOCK] Would have sent email to: ${to}`);
      Logger.info(`📧 [MOCK] Subject: ${subject}`);
      return true;
    }

    Logger.info(`📧 [STEP 3] Transporter ready, preparing mail options...`);

    const mailOptions = {
      from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };

    Logger.info(`📧 [STEP 4] Sending email via Gmail SMTP...`);
    const info = await transporter.sendMail(mailOptions);

    const duration = Date.now() - startTime;
    Logger.info(`✅ [STEP 5] Email sent successfully!`);
    Logger.info(`✅ Message ID: ${info.messageId}`);
    Logger.info(`✅ Recipient: ${to}`);
    Logger.info(`✅ Response: ${JSON.stringify(info.response)}`);
    Logger.info(`✅ Duration: ${duration}ms`);

    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    Logger.error(`❌ [FAILED] Email sending failed after ${duration}ms`);
    Logger.error(`❌ Error name: ${error.name}`);
    Logger.error(`❌ Error message: ${error.message}`);
    Logger.error(`❌ Error code: ${error.code || 'N/A'}`);
    if (error.response) {
      Logger.error(`❌ SMTP Response: ${error.response}`);
    }
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