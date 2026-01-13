import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import initializeDatabase from './config/init-db.js';
import { bootstrapAdminUser } from './config/admin-bootstrap.js';
import { Logger } from './utils/logger.js';
import app from './app.js';

// Suppress dotenv startup logs
const originalLog = console.log;
console.log = () => {};
dotenv.config();
console.log = originalLog;

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Start server with database connection verification
 * Note: For Vercel, this only runs locally. Vercel uses app.js directly.
 */
const startServer = async () => {
  try {
    // Skip DB initialization on Vercel (serverless)
    if (process.env.VERCEL !== '1') {
      // Database Connection
      try {
        await connectDB();
        console.log('✅ Database connected');
      } catch (dbError) {
        Logger.error('Database connection failed', dbError);
        throw new Error('Cannot start server without database connection');
      }
      
      // Initialize database schema
      try {
        await initializeDatabase();
        console.log('✅ Database schema initialized');
      } catch (initError) {
        Logger.error('Database schema initialization failed', initError);
        console.log('⚠️  Database schema may need manual initialization');
      }

      // Bootstrap admin user
      try {
        await bootstrapAdminUser();
        console.log('✅ Admin user verified');
      } catch (adminError) {
        Logger.error('Admin bootstrap failed', adminError);
        console.log('⚠️  Admin user may need manual creation');
      }
    }
    
    // Start Server (only in local development)
    if (NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
      const server = app.listen(PORT, () => {
        console.log('✅ Server started on port ' + PORT);
        console.log(`📡 API available at http://localhost:${PORT}/api`);
      });

      // Graceful Shutdown
      const shutdown = (signal) => {
        Logger.info(`Received ${signal} signal, closing server gracefully`);
        server.close(() => {
          Logger.info('Server closed');
          process.exit(0);
        });
      };

      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));
    }
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      Logger.error('Uncaught exception', error);
      if (NODE_ENV !== 'production') {
        process.exit(1);
      }
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      Logger.error('Unhandled promise rejection', new Error(String(reason)));
      if (NODE_ENV !== 'production') {
        process.exit(1);
      }
    });

  } catch (error) {
    Logger.error('Failed to start server', error);
    if (NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Only run startServer if not in Vercel environment
if (process.env.VERCEL !== '1') {
  startServer();
}

// Export for Vercel
export default app;