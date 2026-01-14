import { Router } from 'express';
const router = Router();

// Controller imports
import { createTask, getTasksByAssignedUser, getTasksByTeam, startTask, completeTask, getTaskDetails, deleteTask, createMemberTask, assignTaskToTeamMembers } from '../controllers/task.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

/**
 * Task Routes
 * 
 * IMPORTANT: Route order matters in Express!
 * - Static routes MUST come before parameterized routes
 * - /my-tasks comes before /:id routes to avoid parameter matching
 */

// Static routes (before parameterized routes)
router.get('/my-tasks', authenticateToken, getTasksByAssignedUser);
router.get('/team/:teamId', authenticateToken, getTasksByTeam);

// Member task routes
router.post('/member/create', authenticateToken, createMemberTask);
router.post('/member/assign-multiple', authenticateToken, assignTaskToTeamMembers);

// Admin task routes
router.post('/', authenticateToken, requireRole(['ADMIN']), createTask);
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), deleteTask);

// Task action routes (for all users)
router.put('/:id/start', authenticateToken, startTask);
router.put('/:id/complete', authenticateToken, completeTask);
router.get('/:id/details', authenticateToken, getTaskDetails);

export default router;