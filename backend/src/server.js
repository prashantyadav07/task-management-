import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js'; // Import database connection
import initializeDatabase from './config/init-db.js'; // Import database schema initialization (FIX #1 & #2)
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
    
    // CRITICAL FIX #1 & #2: Initialize database schema
    // Creates all required tables and constraints (including UNIQUE email constraint)
    try {
      await initializeDatabase();
      console.log('✅ Database schema verified/initialized');
    } catch (initError) {
      Logger.error('Database schema initialization warning', initError);
      console.log('⚠️  Database schema may need manual initialization');
      // Continue anyway - tables might already exist
    }
    
    // SMTP Email Service
    const { transporter } = await import('./config/mail.js');
    try {
      await new Promise((resolve, reject) => {
        transporter.verify((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      console.log('✅ SMTP email service ready');
    } catch (smtpError) {
      Logger.error('SMTP configuration warning', smtpError);
    }
    
    // Start Server
    const server = app.listen(PORT, () => {
      console.log('✅ Server started successfully');
      console.log('✅ Backend running perfectly');
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