import nodemailer from 'nodemailer';
import { Logger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Service
 * Handles sending emails for the application
 * Supports both Gmail and generic SMTP configurations
 */

// Log email configuration status on startup
Logger.info('=== Email Service Configuration ===');

// Determine which email configuration to use
const useGmail = process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD && !process.env.SMTP_HOST;
const useSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

if (useGmail) {
  Logger.info('📧 Using Gmail SMTP configuration');
  Logger.info(`  EMAIL_USER: ${process.env.EMAIL_USER}`);
} else if (useSMTP) {
  Logger.info('📧 Using Generic SMTP configuration');
  Logger.info(`  SMTP_HOST: ${process.env.SMTP_HOST}`);
  Logger.info(`  SMTP_PORT: ${process.env.SMTP_PORT || 587}`);
  Logger.info(`  SMTP_USER: ${process.env.SMTP_USER}`);
} else {
  Logger.warn('⚠️  ❌ NO EMAIL CONFIGURATION DETECTED!');
  Logger.warn('⚠️  Either set Gmail config (EMAIL_USER, EMAIL_APP_PASSWORD) OR SMTP config (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)');
}

// Create reusable transporter
const createTransporter = () => {
  try {
    let transportConfig;

    if (useGmail) {
      transportConfig = {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD
        }
      };
      Logger.info('✅ Gmail SMTP transporter initialized');
    } else if (useSMTP) {
      const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
      const isSecurePort = smtpPort === 465;
      
      transportConfig = {
        host: process.env.SMTP_HOST,
        port: smtpPort,
        secure: isSecurePort,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };
      Logger.info(`✅ SMTP transporter initialized (${isSecurePort ? 'TLS' : 'STARTTLS'})`);
    } else {
      Logger.error('❌ No email configuration found - emails cannot be sent');
      return null;
    }

    const transporter = nodemailer.createTransport(transportConfig);

    // Verify connection
    transporter.verify((error, success) => {
      if (error) {
        Logger.error('❌ Email transporter verification failed:', error.message);
      } else {
        Logger.info('✅ Email transporter verified and ready');
      }
    });

    return transporter;
  } catch (error) {
    Logger.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
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
    // Check if transporter is available
    if (!transporter) {
      Logger.error(`❌ [NO TRANSPORTER] Email NOT sent - email service not configured!`);
      Logger.error(`❌ Please configure either:`);
      Logger.error(`   - Gmail: Set EMAIL_USER and EMAIL_APP_PASSWORD`);
      Logger.error(`   - SMTP: Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS`);
      return false;
    }

    Logger.info(`📧 [STEP 3] Transporter ready, preparing mail options...`);

    // Determine sender based on configuration
    const senderEmail = process.env.EMAIL_USER || process.env.SMTP_USER;
    const senderName = process.env.EMAIL_SENDER_NAME || 'TaskFlow';

    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject,
      text,
      html,
      // Add headers to improve email deliverability
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'TaskFlow/1.0'
      }
    };

    Logger.info(`📧 [STEP 4] Sending email...`);
    Logger.info(`   From: ${mailOptions.from}`);
    Logger.info(`   To: ${to}`);

    const info = await transporter.sendMail(mailOptions);

    const duration = Date.now() - startTime;
    Logger.info(`✅ [STEP 5] Email sent successfully!`);
    Logger.info(`✅ Message ID: ${info.messageId}`);
    Logger.info(`✅ Recipient: ${to}`);
    Logger.info(`✅ Status: ${info.response}`);
    Logger.info(`✅ Duration: ${duration}ms`);

    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    Logger.error(`❌ [FAILED] Email sending failed after ${duration}ms`);
    Logger.error(`❌ Error Type: ${error.name}`);
    Logger.error(`❌ Error Message: ${error.message}`);
    Logger.error(`❌ Error Code: ${error.code || 'N/A'}`);
    
    // Provide diagnostic hints for common errors
    if (error.message.includes('Invalid login') || error.message.includes('authentication')) {
      Logger.error(`❌ 🔐 HINT: Check your email credentials (EMAIL_USER, EMAIL_APP_PASSWORD, or SMTP_USER/SMTP_PASS)`);
      Logger.error(`❌ 🔐 For Gmail: Use an App Password, not your regular password`);
    }
    if (error.message.includes('getaddrinfo')) {
      Logger.error(`❌ 🌐 HINT: Check your SMTP_HOST configuration - it may be invalid or unreachable`);
    }
    if (error.message.includes('timeout')) {
      Logger.error(`❌ ⏱️  HINT: SMTP connection timed out - check network and firewall settings`);
    }
    if (error.response) {
      Logger.error(`❌ SMTP Response: ${error.response}`);
    }
    return false;
  }
};

/**
 * Send invitation email
 * @param {string} email - Recipient email
 * @param {string} inviteTokenOrUrl - Invitation token OR full URL
 * @param {string} teamName - Name of the team
 * @returns {Promise<boolean>} - Success status
 */
export const sendInvitationEmail = async (email, inviteTokenOrUrl, teamName) => {
  // Support both token and full URL for flexibility
  let inviteUrl = inviteTokenOrUrl;
  if (!inviteUrl.startsWith('http')) {
    inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${inviteTokenOrUrl}`;
  }

  return sendEmail({
    to: email,
    subject: `You've been invited to join ${teamName}`,
    text: `You have been invited to join the team "${teamName}". Click the link to accept: ${inviteUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
          <h2 style="color: #10b981; margin-top: 0;">Team Invitation</h2>
          <p>You have been invited to join the team <strong>${teamName}</strong>.</p>
          <p style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Accept Invitation</a>
          </p>
          <p style="color: #666; font-size: 14px;">Or copy this link: <br><a href="${inviteUrl}" style="color: #10b981;">${inviteUrl}</a></p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #999; font-size: 12px;">This is an automated email from TaskFlow. If you did not expect this invitation, please ignore this email.</p>
      </div>
    `
  });
};

// Alias for backward compatibility
export const sendInviteEmail = sendInvitationEmail;

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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
          <h2 style="color: #3b82f6; margin-top: 0;">Password Reset</h2>
          <p>You requested a password reset.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
          </p>
          <p style="color: #666; font-size: 14px;">Or copy this link: <br><a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a></p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #999; font-size: 12px;">This is an automated email from TaskFlow. If you didn't request this, please ignore this email.</p>
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