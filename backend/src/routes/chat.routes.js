import { Router } from 'express';
const router = Router();

// Controller imports
import { getTeamMessages, createMessage, deleteMessage } from '../controllers/chat.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

/**
 * Chat Routes
 * All routes require authentication
 */

// Get team messages
router.get('/:teamId', authenticateToken, getTeamMessages);

// Create a new message
router.post('/:teamId', authenticateToken, createMessage);

// Delete a message
router.delete('/message/:messageId', authenticateToken, deleteMessage);

export default router;
