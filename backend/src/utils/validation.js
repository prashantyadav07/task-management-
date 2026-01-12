/**
 * Input Validation Utility
 * Provides reusable validation functions for API inputs
 */

import { ValidationError } from './errors.js';

/**
 * Validate email format 
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email');
  }
  return email.toLowerCase().trim();
};

/**
 * Validate password strength
 * Minimum 6 characters
 */
export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters long', 'password');
  }
  return password;
};

/**
 * Validate required field
 */
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
  return typeof value === 'string' ? value.trim() : value;
};

/**
 * Validate UUID format
 */
export const validateUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new ValidationError('Invalid ID format', 'id');
  }
  return uuid;
};

/**
 * Validate numeric ID
 */
export const validateNumericId = (id) => {
  const numId = Number(id);
  if (isNaN(numId) || numId <= 0 || !Number.isInteger(numId)) {
    throw new ValidationError('Invalid ID format', 'id');
  }
  return numId;
};

/**
 * Validate user ID (VARCHAR format - can be numeric or string)
 */
export const validateUserId = (id) => {
  if (!id || (typeof id === 'string' && id.trim() === '')) {
    throw new ValidationError('Invalid ID format', 'id');
  }
  // Accept both numeric strings and alphanumeric strings (e.g., 'ADMIN')
  const trimmedId = String(id).trim();
  if (trimmedId.length === 0 || trimmedId.length > 50) {
    throw new ValidationError('Invalid ID format', 'id');
  }
  return trimmedId;
};

/**
 * Validate team name
 */
export const validateTeamName = (name) => {
  const trimmedName = validateRequired(name, 'Team name');
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    throw new ValidationError('Team name must be between 2 and 100 characters', 'name');
  }
  return trimmedName;
};

/**
 * Validate task title
 */
export const validateTaskTitle = (title) => {
  const trimmedTitle = validateRequired(title, 'Task title');
  if (trimmedTitle.length < 3 || trimmedTitle.length > 200) {
    throw new ValidationError('Task title must be between 3 and 200 characters', 'title');
  }
  return trimmedTitle;
};

/**
 * Validate user name
 */
export const validateUserName = (name) => {
  const trimmedName = validateRequired(name, 'Name');
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    throw new ValidationError('Name must be between 2 and 100 characters', 'name');
  }
  return trimmedName;
};

export default {
  validateEmail,
  validatePassword,
  validateRequired,
  validateUUID,
  validateNumericId,
  validateUserId,
  validateTeamName,
  validateTaskTitle,
  validateUserName,
};
