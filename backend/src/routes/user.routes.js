import { Router } from 'express';
const router = Router();

// Controller imports
import {
  getAllUsers,
  getUserStats,
  getUserDetails,
  assignTaskToUser,
  assignTaskToMultipleUsers,
} from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

/**
 * User Management Routes
 * 
 * All routes require:
 * - Authentication (valid JWT token)
 * - ADMIN role
 */

// Static routes (must come before parameterized routes)
router.get('/stats/count', authenticateToken, requireRole(['ADMIN']), getUserStats);
router.get('/', authenticateToken, requireRole(['ADMIN']), getAllUsers);
router.post('/assign-task-bulk', authenticateToken, requireRole(['ADMIN']), assignTaskToMultipleUsers);

// Parameterized routes (after static routes)
router.get('/:userId', authenticateToken, requireRole(['ADMIN']), getUserDetails);
router.post('/:userId/assign-task', authenticateToken, requireRole(['ADMIN']), assignTaskToUser);

export default router;
