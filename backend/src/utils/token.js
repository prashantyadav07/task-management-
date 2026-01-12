import jwt from "jsonwebtoken";

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};import { v4 as uuidv4 } from 'uuid';

// Function to generate a secure random token (using UUID v4 as an example)
export const generateSecureToken = () => {
  return uuidv4(); // Generates a random UUID string
  // Alternatively, you could use crypto.randomBytes if preferred
  // const crypto = require('crypto');
  // return crypto.randomBytes(32).toString('hex');
};
