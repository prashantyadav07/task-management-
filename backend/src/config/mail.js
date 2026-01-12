import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configure the Nodemailer transporter using SMTP settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter configuration
transporter.verify((error) => {
  if (error) {
    // Silently fail SMTP verification - errors will be caught when sending mail
  }
  // Success is handled in server startup
});

export { transporter };