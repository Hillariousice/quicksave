import Redis from 'ioredis';
import { env } from './env'; // Ensure env is imported!

// Use the URL from your .env file
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null, 
  lazyConnect: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    console.warn(`[Redis] Reconnecting... attempt ${times}, delay ${delay}ms`);
    return delay;
  },
});

redisClient.on('connect', () => {
  console.log('🟢 [Redis] Connected successfully');
});

redisClient.on('error', (err) => {
  console.error('🔴 [Redis] Connection error:', err.message);
});

export default redisClient;