import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const performanceTracker = (req: Request, res: Response, next: NextFunction) => {
  // Capture high-resolution real time at the exact moment the request hits the server
  const start = process.hrtime();

  // Listen for the 'finish' event (when Express sends the final byte to the mobile app)
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

    // Flag slow queries automatically!
    const isSlow = Number(durationMs) > 500; // Anything over 500ms is a red flag in FinTech

    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(durationMs),
      warning: isSlow ? '🐢 SLOW ROUTE DETECTED' : undefined
    }, `[HTTP] ${req.method} ${req.originalUrl} - ${durationMs}ms`);
  });

  next();
};