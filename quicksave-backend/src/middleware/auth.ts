import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env'; // Or wherever you put env.ts
import { AppError } from '../utils/AppError';

// import { JwtPayload } from '../types';
import prisma from '../config/database';

// Extend Express Request type to include the authenticated user object
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;
    
    // Extract token from "Authorization: Bearer <token>" header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please provide a token.', 401));
    }

    // Verify token using your typed environment variable
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 3. ⭐️ SENIOR DEV MOVE: Check if the user is suspended!
    if (currentUser.status === 'SUSPENDED') {
      return next(new AppError('Your account has been suspended. Please contact support.', 403));
    }


    // Attach user payload to the request
    req.user = currentUser;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid token. Please log in again.', 401));
  }
};