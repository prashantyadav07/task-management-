import { Router } from 'express';
const router = Router();

// Placeholder controller imports (will be created in later steps)
// Only import sendInvitation, as acceptInvitation is handled by signupViaInvite in auth.controller.js
import { sendInvitation } from '../controllers/invite.controller.js';
import { sendBulkInvitation, acceptBulkInvitation, getBulkBatch } from '../controllers/bulk-invite.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js'; // Will be created in Step 4
import { requireRole } from '../middlewares/role.middleware.js'; // Will be created in Step 4

// Single invitation routes
router.post('/', authenticateToken, sendInvitation); // Send single invitation (admin or team owner/member)
// Note: Accepting invitation happens via the frontend calling /api/auth/signup-via-invite with the token.
// Therefore, no separate route like '/accept' is needed here.

// Bulk invitation routes
router.post('/bulk', authenticateToken, sendBulkInvitation); // Send multiple invitations at once
router.post('/bulk/accept/:token', authenticateToken, acceptBulkInvitation); // Accept a bulk invitation
router.get('/bulk/:batchId', authenticateToken, getBulkBatch); // Get bulk batch details

export default router; // Export the configured router