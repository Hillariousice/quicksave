import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  // In development, use pino-pretty to make logs readable for humans.
  // In production, undefined means Pino will output raw, blazing-fast JSON.
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname', // Keeps the console output clean
          },
        }
      : undefined,
});