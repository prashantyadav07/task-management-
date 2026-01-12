import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Logger } from './utils/logger.js';
import { AppError } from './utils/errors.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import teamRoutes from './routes/team.routes.js';
import taskRoutes from './routes/task.routes.js';
import inviteRoutes from './routes/invite.routes.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // For parsing JSON bodies with size limit

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/users', userRoutes);

/**
 * 404 Not Found Handler
 * MUST come after all other routes
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    errorCode: 'ROUTE_NOT_FOUND',
    message: `The requested ${req.method} ${req.path} does not exist`,
  });
});

/**
 * Centralized Error Handling Middleware
 * Must be defined AFTER all other routes and middlewares
 * 
 * Error priority:
 * 1. AppError (custom) - return structured response
 * 2. Database errors (ENOTFOUND, ECONNREFUSED) - service unavailable
 * 3. JSON parse errors - bad request
 * 4. Unexpected errors - generic internal server error
 */
app.use((err, req, res, next) => {
  // Log the error with full context
  const errorContext = {
    method: req.method,
    path: req.path,
    userId: req.user?.userId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
  };

  Logger.error(`[${req.method}] ${req.path}`, err, errorContext);

  // Handle AppError (custom application errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      errorCode: err.errorCode,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { 
        timestamp: err.timestamp,
        path: req.path,
        method: req.method,
      }),
    });
  }

  // Handle database connection errors
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    Logger.error('🔴 Database connection error detected', err, { code: err.code });
    return res.status(503).json({
      success: false,
      errorCode: 'SERVICE_UNAVAILABLE',
      message: 'Database service is currently unavailable. Please try again later.',
      ...(process.env.NODE_ENV === 'development' && { error: err.message }),
    });
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    Logger.warn('Invalid JSON in request body', err);
    return res.status(400).json({
      success: false,
      errorCode: 'INVALID_JSON',
      message: 'Invalid JSON format in request body. Please check your request.',
    });
  }

  // Handle route parameter errors (e.g., PathError)
  if (err.name === 'PathError' || err.message.includes('Missing parameter')) {
    Logger.error('🔴 Route parameter error', err, { path: req.path, params: req.params });
    return res.status(400).json({
      success: false,
      errorCode: 'INVALID_ROUTE_PARAMETERS',
      message: 'Invalid route parameters. Please check your request URL.',
      ...(process.env.NODE_ENV === 'development' && { error: err.message }),
    });
  }

  // Handle unexpected errors
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  Logger.error('💥 Unexpected error - check logs for details', err, errorContext);

  res.status(statusCode).json({
    success: false,
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: isDevelopment
      ? err.message || 'An unexpected error occurred'
      : 'An unexpected error occurred. Please try again later. If the problem persists, contact support.',
    ...(isDevelopment && {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    }),
  });
});

export default app;