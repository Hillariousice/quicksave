import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  try {
    // 1. Extract token from the auth payload we sent from the mobile app
    const token = socket.handshake.auth?.token;

    if (!token) {
      logger.warn(`Socket connection rejected: No token provided (${socket.id})`);
      return next(new Error('Authentication error: No token provided'));
    }

    // 2. Verify the JWT
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };

    // 3. Attach the user data to the socket session
    socket.data.user = { id: decoded.id };
    
    next();
  } catch (error) {
    logger.warn(`Socket connection rejected: Invalid token (${socket.id})`);
    next(new Error('Authentication error: Invalid or expired token'));
  }
};