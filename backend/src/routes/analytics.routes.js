import express from 'express';
import {
  getDashboardStats,
  getCompletedTasks,
  getRecentTasks,
  getTeamStats,
  getUserStats,
  getCompletionTime,
  getCompletionRateStats,
} from '../controllers/analytics.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { authorizeAdmin } from '../middlewares/role.middleware.js';

const router = express.Router();

// All analytics routes require authentication
router.use(authenticateToken);

/**
 * Dashboard Statistics
 * GET /api/analytics/dashboard
 * Requires: ADMIN role
 */
router.get('/dashboard', authorizeAdmin, getDashboardStats);

/**
 * Completed Tasks with Timestamps
 * GET /api/analytics/completed-tasks
 * Requires: ADMIN role
 */
router.get('/completed-tasks', authorizeAdmin, getCompletedTasks);

/**
 * Recent Tasks
 * GET /api/analytics/recent-tasks?limit=10
 * Requires: Authentication
 */
router.get('/recent-tasks', getRecentTasks);

/**
 * Team Task Statistics
 * GET /api/analytics/team/:teamId
 * Requires: User must be a team member or ADMIN
 */
router.get('/team/:teamId', getTeamStats);

/**
 * User Task Statistics
 * GET /api/analytics/user/:userId
 * Requires: ADMIN or the user themselves
 */
router.get('/user/:userId', getUserStats);

/**
 * Average Task Completion Time
 * GET /api/analytics/completion-time
 * Requires: ADMIN role
 */
router.get('/completion-time', authorizeAdmin, getCompletionTime);

/**
 * Task Completion Rate
 * GET /api/analytics/completion-rate
 * Requires: ADMIN role
 */
router.get('/completion-rate', authorizeAdmin, getCompletionRateStats);

export default router;
