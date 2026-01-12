import { Router } from 'express';
const router = Router();

// Placeholder controller imports (will be created in later steps)
// Only import sendInvitation, as acceptInvitation is handled by signupViaInvite in auth.controller.js
import { sendInvitation } from '../controllers/invite.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js'; // Will be created in Step 4
import { requireRole } from '../middlewares/role.middleware.js'; // Will be created in Step 4

// Define routes
router.post('/', authenticateToken, requireRole(['ADMIN']), sendInvitation); // Send invitation (admin only)
// Note: Accepting invitation happens via the frontend calling /api/auth/signup-via-invite with the token.
// Therefore, no separate route like '/accept' is needed here.

export default router; // Export the configured router