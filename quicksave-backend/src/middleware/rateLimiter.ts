import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../config/redis';

// Strict limiter for Login, Register, and OTP routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests
  standardHeaders: true, 
  legacyHeaders: false, 
  // 👉 Tell Express to use a unique name for this limiter
  requestPropertyName: 'rateLimitAuth', 
  store: new RedisStore({
    // @ts-expect-error
    sendCommand: (...args: string[]) => redisClient.call(...args),
    // 👉 Add a prefix so Redis stores these counts separately
    prefix: 'rl_auth:', 
  }),
  handler: (req, res, next) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts from this IP. Please try again in 15 minutes.',
    });
  },
});

// General limiter for the rest of the app
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests
  standardHeaders: true,
  legacyHeaders: false,
  // 👉 FIX 1: Tell Express to use a unique name for this limiter
  requestPropertyName: 'rateLimitApi',
  store: new RedisStore({
    // @ts-expect-error
    sendCommand: (...args: string[]) => redisClient.call(...args),
    // 👉 FIX 2: Add a prefix so Redis stores these counts separately
    prefix: 'rl_api:', 
  }),
  handler: (req, res, next) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  },
});