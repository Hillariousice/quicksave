import { Server } from 'socket.io';
import { logger } from './logger';

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, '🔌 New client connected via Socket.io');

    // When the mobile app opens a group, it asks to join a "room" for that specific group
    socket.on('joinGroup', (groupId) => {
      socket.join(groupId);
      logger.info(`Socket ${socket.id} joined group room: ${groupId}`);
    });

    socket.on('disconnect', () => {
      logger.info('Client disconnected');
    });
  });

  return io;
};

// Expose this so controllers can trigger real-time events!
export const getIo = () => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};