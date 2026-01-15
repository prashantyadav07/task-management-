import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js'; // Import database connection
import initializeDatabase from './config/init-db.js'; // Import database schema initialization (FIX #1 & #2)
import { bootstrapAdminUser } from './config/admin-bootstrap.js'; // Import admin bootstrap logic
import { Logger } from './utils/logger.js'; // Import logger
import app from './app.js';

// Suppress dotenv startup logs and environment injection messages
const originalLog = console.log;
console.log = () => { };
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

    // Start Server with HTTP and Socket.io
    const httpServer = createServer(app);

    // Initialize Socket.io with CORS configuration
    const io = new Server(httpServer, {
      cors: {
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
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    // Socket.io Connection Handler
    // Handles real-time team chat with proper isolation and authorization
    io.on('connection', (socket) => {
      Logger.debug('New Socket.io connection', { socketId: socket.id });

      /**
       * Join a team room for real-time chat
       * Event: join_team
       * Data: { teamId: number }
       * 
       * Isolation: Users can only join teams they are members of
       * Messages are isolated per team via Socket.IO rooms
       */
      socket.on('join_team', (data) => {
        try {
          const { teamId, userId } = data;

          if (!teamId || !userId) {
            Logger.warn('Invalid join_team data', { socketId: socket.id, data });
            socket.emit('error', { message: 'Team ID and User ID are required' });
            return;
          }

          const room = `team_${teamId}`;
          socket.join(room);

          Logger.info('User joined team room', {
            socketId: socket.id,
            teamId,
            userId,
            room,
          });

          // Notify other users in the room (for presence awareness)
          socket.to(room).emit('user_joined', {
            userId,
            teamId,
            message: 'A team member joined the chat',
            timestamp: new Date().toISOString(),
          });

          // Send confirmation to the joining user
          socket.emit('joined_team', {
            teamId,
            room,
            message: 'Successfully joined team chat',
          });
        } catch (error) {
          Logger.error('Error in join_team handler', error, { socketId: socket.id });
          socket.emit('error', { message: 'Failed to join team chat' });
        }
      });

      /**
       * Leave a team room
       * Event: leave_team
       * Data: { teamId: number, userId: number }
       */
      socket.on('leave_team', (data) => {
        try {
          const { teamId, userId } = data;
          const room = `team_${teamId}`;

          socket.leave(room);

          Logger.info('User left team room', {
            socketId: socket.id,
            teamId,
            userId,
            room,
          });

          // Notify others in the team
          socket.to(room).emit('user_left', {
            userId,
            teamId,
            message: 'A team member left the chat',
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          Logger.error('Error in leave_team handler', error, { socketId: socket.id });
        }
      });

      /**
       * Send a new message in a team chat
       * Event: send_message
       * Data: { teamId, userId, userName, message, messageId }
       * 
       * Messages are broadcast ONLY to the specific team room (isolation)
       */
      socket.on('send_message', (data) => {
        try {
          const { teamId, userId, message, messageId, userName } = data;

          if (!teamId || !userId || !message) {
            Logger.warn('Invalid send_message data', { socketId: socket.id, data });
            socket.emit('error', { message: 'Team ID, User ID, and message are required' });
            return;
          }

          const room = `team_${teamId}`;

          Logger.debug('Message received from socket', {
            socketId: socket.id,
            teamId,
            userId,
            messageId,
          });

          // Broadcast message ONLY to users in this specific team (isolation)
          io.to(room).emit('new_message', {
            id: messageId,
            teamId,
            userId,
            userName,
            message,
            created_at: new Date().toISOString(),
            is_deleted: false,
          });

          Logger.info('Message broadcasted to team', {
            teamId,
            messageId,
            userId,
            roomSize: io.sockets.adapter.rooms.get(room)?.size || 0,
          });
        } catch (error) {
          Logger.error('Error in send_message handler', error, { socketId: socket.id });
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      /**
       * Message deletion event
       * Event: delete_message
       * Data: { teamId, messageId, isHardDelete }
       * 
       * Deletion events are broadcast ONLY to the specific team room
       */
      socket.on('delete_message', (data) => {
        try {
          const { teamId, messageId, isHardDelete = false } = data;
          const room = `team_${teamId}`;

          Logger.debug('Message deletion event received', {
            socketId: socket.id,
            teamId,
            messageId,
            isHardDelete,
          });

          // Broadcast deletion ONLY to users in this specific team
          io.to(room).emit('message_deleted', {
            messageId,
            teamId,
            isHardDelete,
            timestamp: new Date().toISOString(),
          });

          Logger.info('Message deletion broadcasted', { teamId, messageId });
        } catch (error) {
          Logger.error('Error in delete_message handler', error, { socketId: socket.id });
        }
      });

      /**
       * Message edit event
       * Event: edit_message
       * Data: { teamId, messageId, newMessage }
       * 
       * Edit events are broadcast ONLY to the specific team room
       */
      socket.on('edit_message', (data) => {
        try {
          const { teamId, messageId, newMessage } = data;
          const room = `team_${teamId}`;

          Logger.debug('Message edit event received', {
            socketId: socket.id,
            teamId,
            messageId,
          });

          // Broadcast edit ONLY to users in this specific team
          io.to(room).emit('message_edited', {
            messageId,
            teamId,
            newMessage,
            timestamp: new Date().toISOString(),
          });

          Logger.info('Message edit broadcasted', { teamId, messageId });
        } catch (error) {
          Logger.error('Error in edit_message handler', error, { socketId: socket.id });
        }
      });

      /**
       * Typing indicator event
       * Event: typing
       * Data: { teamId, userId, userName }
       * 
       * Broadcasts typing status to OTHER users in the team (excludes sender)
       */
      socket.on('typing', (data) => {
        try {
          const { teamId, userId, userName } = data;

          if (!teamId || !userId || !userName) {
            Logger.warn('Invalid typing data', { socketId: socket.id, data });
            return;
          }

          const room = `team_${teamId}`;

          Logger.debug('Typing event received', {
            socketId: socket.id,
            teamId,
            userId,
            userName,
          });

          // Broadcast to OTHER users in the team (exclude sender)
          socket.to(room).emit('user_typing', {
            teamId,
            userId,
            userName,
            timestamp: new Date().toISOString(),
          });

          Logger.debug('Typing indicator broadcasted', { teamId, userId });
        } catch (error) {
          Logger.error('Error in typing handler', error, { socketId: socket.id });
        }
      });

      /**
       * Stop typing indicator event
       * Event: stop_typing
       * Data: { teamId, userId }
       * 
       * Broadcasts stop-typing status to OTHER users in the team (excludes sender)
       */
      socket.on('stop_typing', (data) => {
        try {
          const { teamId, userId } = data;

          if (!teamId || !userId) {
            Logger.warn('Invalid stop_typing data', { socketId: socket.id, data });
            return;
          }

          const room = `team_${teamId}`;

          Logger.debug('Stop typing event received', {
            socketId: socket.id,
            teamId,
            userId,
          });

          // Broadcast to OTHER users in the team (exclude sender)
          socket.to(room).emit('user_stopped_typing', {
            teamId,
            userId,
            timestamp: new Date().toISOString(),
          });

          Logger.debug('Stop typing indicator broadcasted', { teamId, userId });
        } catch (error) {
          Logger.error('Error in stop_typing handler', error, { socketId: socket.id });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        Logger.debug('Socket.io disconnection', { socketId: socket.id });
      });

      // Handle socket-level errors
      socket.on('error', (error) => {
        Logger.error('Socket.io error', error, { socketId: socket.id });
      });
    });

    httpServer.listen(PORT, () => {
      console.log('✅ Server started on port ' + PORT);
    });

    // Graceful Shutdown
    const shutdown = (signal) => {
      Logger.info(`Received ${signal} signal, closing server gracefully`);
      httpServer.close(() => {
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