import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { logger } from '../config/logger';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction // Express knows it's an error handler because of this 4th argument
) => {
  // Default to 500 server error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Log the error for your own debugging
  logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${statusCode}, Message:: ${message}`);
  if (statusCode === 500) {
    logger.error(err.stack); // Only log full stack trace for 500 bugs
  }

  // Handle specific Prisma Database Errors automatically
  if (err.code === 'P2002') {
    // Unique constraint failed (e.g., email already exists)
    statusCode = 409;
    message = 'A record with this data already exists.';
  } else if (err.code === 'P2025') {
    // Record not found
    statusCode = 404;
    message = 'Record not found in the database.';
  }

  // Send consistent JSON back to the mobile app
  return sendError(res, message, statusCode, err.errors || undefined);
};