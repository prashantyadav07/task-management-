import { transporter } from '../config/mail.js';
import { Logger } from '../utils/logger.js';
import { EmailServiceError } from '../utils/errors.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Send an invitation email
 * @param {string} toEmail - Recipient email address
 * @param {string} inviteLink - Invitation acceptance link
 * @throws {EmailServiceError}
 */
export const sendInviteEmail = async (toEmail, inviteLink) => {
  try {
    if (!process.env.SMTP_USER) {
      Logger.error('SMTP configuration incomplete - SMTP_USER not set');
      throw new EmailServiceError('Email service is not properly configured');
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: toEmail,
      subject: 'Task Management System - Team Invitation',
      text: `You have been invited to join a team in the Task Management System. Click the link below to accept the invitation and set up your account:\n\n${inviteLink}\n\nThis link is valid for 24 hours.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Task Management System - Team Invitation</h2>
          <p>You have been invited to join a team in the Task Management System.</p>
          <p>Click the link below to accept the invitation and set up your account:</p>
          <p>
            <a href="${inviteLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accept Invitation
            </a>
          </p>
          <p><em>This link is valid for 24 hours.</em></p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">If you did not expect this invitation, please contact your team administrator.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    Logger.info('Invitation email sent successfully', {
      messageId: info.messageId,
      to: toEmail,
    });

    return true;

  } catch (error) {
    Logger.error('Failed to send invitation email', error, { toEmail });
    throw new EmailServiceError('Failed to send invitation email', error);
  }
};

export default { sendInviteEmail };