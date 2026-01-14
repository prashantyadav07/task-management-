import { Router } from 'express';
const router = Router();

// Placeholder controller imports (will be created in later steps)
import { createTeam, getTeamsForUser, getTeamMembers, addMemberToTeam, deleteTeam } from '../controllers/team.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js'; // Will be created in Step 4
import { requireRole } from '../middlewares/role.middleware.js'; // Will be created in Step 4

// Define routes
router.post('/', authenticateToken, createTeam); // Create team (any authenticated user)
router.get('/', authenticateToken, getTeamsForUser); // Get teams for the logged-in user
router.get('/:id/members', authenticateToken, getTeamMembers); // Get members of a specific team
router.post('/:id/members', authenticateToken, addMemberToTeam); // Add member to team (any authenticated user)
router.delete('/:id', authenticateToken, deleteTeam); // Delete team (team creator only)

export default router; // Export the configured router