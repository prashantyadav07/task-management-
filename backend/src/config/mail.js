/**
 * DEPRECATED: This file is kept for backward compatibility only.
 * Please use email.service.js instead for email sending.
 * 
 * The email.service.js provides:
 * - Support for both Gmail and generic SMTP
 * - Better error handling and diagnostics
 * - Consistent configuration management
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { Logger } from '../utils/logger.js';

// Suppress dotenv logs
const originalLog = console.log;
console.log = () => {};
dotenv.config();
console.log = originalLog;

// LEGACY: Configure transporter for backward compatibility
// NOTE: This is not used anymore - use email.service.js instead
const transporter = null; // Disabled - use email.service.js

Logger.warn('⚠️  mail.js is deprecated. Use src/services/email.service.js instead.');

export { transporter };