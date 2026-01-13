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
import analyticsRoutes from './routes/analytics.routes.js';

dotenv.config();

const app = express();

// CORS Configuration - Allow Multiple Origins
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174',
      'https://task-management-k3fk.vercel.app',
      'https://task-management-k3fk-git-main-prashant-yadavs-projects-157031if.vercel.app',
      'https://task-management-k3fk-prashant-yadavs-projects-157031if.vercel.app'
    ];
    
    // Allow requests with no origin (Postman, mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (allowedOrigins.some(allowed => origin.includes('task-management-k3fk') || origin.includes('localhost'))) {
      callback(null, true);
    } else {
      console.log('⚠️ CORS blocked origin:', origin);
      callback(null, true); // Allow for now during debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight for all routes

// Middleware
app.use(express.json({ limit: '10mb' })); // For parsing JSON bodies with size limit
app.use(express.urlencoded({ extended: true }));

// Health Check Routes (MUST come before API routes)
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Task Management API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

/**
 * Centralized Error Handling Middleware
 * Must be defined AFTER all other routes and middlewares
 */
app.use((err, req, res, next) => {
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

  // Handle unexpected errors
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  Logger.error('💥 Unexpected error - check logs for details', err, errorContext);

  res.status(statusCode).json({
    success: false,
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: isDevelopment
      ? err.message || 'An unexpected error occurred'
      : 'An unexpected error occurred. Please try again later.',
    ...(isDevelopment && {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    }),
  });
});

export default app;

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

/**
 * 404 Not Found Handler
 * MUST come after all other routes
 */
app.use((req, res) => {
  Logger.warn(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    errorCode: 'ROUTE_NOT_FOUND',
    message: `The requested ${req.method} ${req.path} does not exist`,
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Task Management API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      teams: '/api/teams',
      tasks: '/api/tasks',
      invites: '/api/invites',
      users: '/api/users',
      analytics: '/api/analytics'
    }
  });
});