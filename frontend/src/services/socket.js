import { io } from 'socket.io-client';

// Socket.IO server URL - automatically detects environment
const SOCKET_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://task-management-ten-neon.vercel.app';

console.log('🔌 Socket.IO URL:', SOCKET_URL);

// Determine if we're in production
const isProduction = window.location.hostname !== 'localhost';

// Create socket instance
// NOTE: Vercel serverless functions don't support persistent WebSocket connections
// Use polling transport in production as a workaround
const socket = io(SOCKET_URL, {
    transports: isProduction ? ['polling'] : ['websocket', 'polling'],
    autoConnect: false, // Manual connection control
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    // Increase timeout for polling
    timeout: 20000,
});

// Connection event handlers
socket.on('connect', () => {
    console.log('✅ Socket.IO connected:', socket.id);
});

socket.on('disconnect', (reason) => {
    console.log('❌ Socket.IO disconnected:', reason);
});

socket.on('connect_error', (error) => {
    console.error('❌ Socket.IO connection error:', error.message);
});

socket.on('error', (error) => {
    console.error('❌ Socket.IO error:', error);
});

export default socket;
