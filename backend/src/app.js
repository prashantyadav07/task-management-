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
import chatRoutes from './routes/chat.routes.js';

dotenv.config();

const app = express();

// CRITICAL: Enable CORS for all routes with proper configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'https://task-management-k3fk.vercel.app',
    'https://task-management-k3fk-prashant-yadavs-projects-1570311f.vercel.app',
    'https://task-management-k3fk-dxabvzxdl.vercel.app',
    'https://task-management-k3fk-git-main-prashant-yadavs-projects-1570311f.vercel.app',
    'https://task-management-k3fk-pnbzskr2t.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
  optionsSuccessStatus: 200
};

// Apply CORS middleware FIRST
app.use(cors(corsOptions));

// Handle preflight requests explicitly (Express 5 syntax)
app.options('/{*path}', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Add CORS headers manually as backup
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (corsOptions.origin.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Health check routes
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Task Management API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    cors: 'enabled'
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);

// 404 Handler
app.use((req, res) => {
  Logger.warn(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    errorCode: 'ROUTE_NOT_FOUND',
    message: `The requested ${req.method} ${req.path} does not exist`,
  });
});

// Error Handler
app.use((err, req, res, next) => {
  const errorContext = {
    method: req.method,
    path: req.path,
    userId: req.user?.userId,
    timestamp: new Date().toISOString(),
  };

  Logger.error(`[${req.method}] ${req.path}`, err, errorContext);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      errorCode: err.errorCode,
      message: err.message,
    });
  }

  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      errorCode: 'SERVICE_UNAVAILABLE',
      message: 'Database service is currently unavailable.',
    });
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      errorCode: 'INVALID_JSON',
      message: 'Invalid JSON format in request body.',
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred.',
  });
});

export default app;