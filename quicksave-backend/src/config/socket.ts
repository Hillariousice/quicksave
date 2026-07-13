import { Server, Socket } from 'socket.io';
import prisma from './database';
import { logger } from './logger';
import { socketAuthMiddleware } from '../middleware/socketAuth';
import { presenceService } from '../services/presence.service';

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: { origin: '*' },
    // Tune for spotty 3G/4G networks!
    pingInterval: 20000,  // Send a heartbeat every 20 seconds
    pingTimeout: 40000,   // Wait 40 seconds for a response before killing the ghost connection
  });

  // 1. Apply Authentication Middleware
  io.use(socketAuthMiddleware);

  io.on('connection', async (socket: Socket) => {
    const userId = socket.data.user.id;
    logger.info({ socketId: socket.id, userId }, '🟢 Client connected & authenticated');

    socket.join(`user_${userId}`);
    // 2. Track Presence in Redis
    await presenceService.addClient(userId, socket.id);

    // 3. Auto-hydrate Group Subscriptions!
    // Instead of trusting the mobile app to rejoin rooms, we force them into the 
    // correct rooms based on their database memberships.
    try {
      const memberships = await prisma.groupMember.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { groupId: true }
      });

      const roomsToJoin = memberships.map(m => m.groupId);
      if (roomsToJoin.length > 0) {
        socket.join(roomsToJoin);
        logger.debug({ userId, roomsCount: roomsToJoin.length }, 'Auto-joined group rooms');
      }
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to auto-join rooms');
    }

    // 4. Handle Disconnection
    socket.on('disconnect', async (reason) => {
      logger.info({ socketId: socket.id, userId, reason }, '🔴 Client disconnected');
      
      // Remove from Redis Presence Tracking
      await presenceService.removeClient(userId, socket.id);
    });

    // 5. Explicit Manual Room Join (If they create a new group while already connected)
    socket.on('joinGroup', (groupId: string) => {
      socket.join(groupId);
      logger.debug({ socketId: socket.id, groupId }, 'Manually joined group room');
    });

    socket.on('joinGroupScreen', async (groupId: string) => {
      try {
        // 🚨 SECURITY CHECK: Ensure they are an active member of this group!
        const isMember = await prisma.groupMember.findFirst({
          where: { userId, groupId, status: 'ACTIVE' }
        });

        if (!isMember) {
          logger.warn({ userId, groupId }, 'Unauthorized socket room join attempt!');
          socket.emit('socketError', { message: 'Unauthorized to view this group' });
          return; // Block them!
        }

        const roomName = `screen_${groupId}`;
        socket.join(roomName);
        logger.debug({ socketId: socket.id, roomName }, 'Joined active screen room');
        
        // Optional: Let others know someone is looking at the screen (Presence)
        socket.to(roomName).emit('memberEnteredScreen', { userId });

      } catch (error) {
        logger.error({ err: error }, 'Error joining group screen room');
      }
    });

    // 👉 2.GRACEFUL CLEANUP
    socket.on('leaveGroupScreen', (groupId: string) => {
      const roomName = `screen_${groupId}`;
      socket.leave(roomName);
      logger.debug({ socketId: socket.id, roomName }, 'Left active screen room');
      
    socket.to(roomName).emit('memberLeftScreen', { userId });
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};