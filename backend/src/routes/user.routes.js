import { Router } from 'express';
const router = Router();

// Controller imports
import {
  getAllUsers,
  getUserStats,
  getUserDetails,
  assignTaskToUser,
  assignTaskToMultipleUsers,
  deleteMember,
} from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

/**
 * User Management Routes
 * 
 * Most routes require:
 * - Authentication (valid JWT token)
 * - ADMIN role
 * 
 * Exception: GET /users is available to all authenticated users
 */

// Static routes (must come before parameterized routes)
router.get('/stats/count', authenticateToken, requireRole(['ADMIN']), getUserStats);
router.get('/', authenticateToken, getAllUsers); // Allow all authenticated users to view user list
router.post('/assign-task-bulk', authenticateToken, requireRole(['ADMIN']), assignTaskToMultipleUsers);

// Parameterized routes (after static routes)
router.get('/:userId', authenticateToken, requireRole(['ADMIN']), getUserDetails);
router.post('/:userId/assign-task', authenticateToken, requireRole(['ADMIN']), assignTaskToUser);
router.delete('/:userId', authenticateToken, requireRole(['ADMIN']), deleteMember);

export default router;
