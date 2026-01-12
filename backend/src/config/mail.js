import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { Logger } from '../utils/logger.js';

// Suppress dotenv logs
const originalLog = console.log;
console.log = () => {};
dotenv.config();
console.log = originalLog;

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
    Logger.error('SMTP service failed to initialize', error);
  } else {
    console.log('✅ SMTP service ready');
  }
});

export { transporter };