import redis from '../config/redis';
import { logger } from '../config/logger';

export const presenceService = {
  // 1. Mark user as online (Adds socket ID to their personal Set)
  async addClient(userId: string, socketId: string) {
    const key = `presence:${userId}`;
    await redis.sadd(key, socketId);
    // Auto-expire after 24h just in case of server crashes leaving ghost data
    await redis.expire(key, 86400); 
    logger.debug({ userId, socketId }, 'User marked as online');
  },

  // 2. Mark user as offline (Removes specific socket ID)
  async removeClient(userId: string, socketId: string) {
    const key = `presence:${userId}`;
    await redis.srem(key, socketId);
    
    // Check if they have any other devices still connected
    const activeConnections = await redis.scard(key);
    if (activeConnections === 0) {
      logger.info({ userId }, 'User is completely offline (All devices disconnected)');
      // Here you could emit an event to tell their friends they went offline!
    } else {
      logger.debug({ userId, remaining: activeConnections }, 'Device disconnected, but user is still active on another device');
    }
  },

  // 3. Check if a user is online
  async isUserOnline(userId: string): Promise<boolean> {
    const activeConnections = await redis.scard(`presence:${userId}`);
    return activeConnections > 0;
  }
};