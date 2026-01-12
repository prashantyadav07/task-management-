import { Router } from 'express';
const router = Router();

// Controller imports
import { login, signup, signupViaInvite, verifyInvite } from '../controllers/auth.controller.js';

// Define routes
router.post('/login', login); // Login route
router.post('/signup', signup); // Public signup route (no invitation required)
router.post('/verify-invite', verifyInvite); // Verify invitation token route
router.post('/signup-via-invite', signupViaInvite); // Signup via invite route (handles token verification)

export default router; // Export the configured router