import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js'; // Import database connection
import initializeDatabase from './config/init-db.js'; // Import database schema initialization (FIX #1 & #2)
import { bootstrapAdminUser } from './config/admin-bootstrap.js'; // Import admin bootstrap logic
import { Logger } from './utils/logger.js'; // Import logger
import app from './app.js';

// Suppress dotenv startup logs and environment injection messages
const originalLog = console.log;
console.log = () => {};
dotenv.config();
console.log = originalLog;

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Start server with database connection verification
 */
const startServer = async () => {
  try {
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
    
    // Start Server
    const server = app.listen(PORT, () => {
      console.log('✅ Server started on port ' + PORT);
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
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      Logger.error('Uncaught exception', error);
      process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      Logger.error('Unhandled promise rejection', new Error(String(reason)));
      process.exit(1);
    });

  } catch (error) {
    Logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();

export default app; // Export for potential testing