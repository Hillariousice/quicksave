import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const requireKycTier1 = (req: Request, res: Response, next: NextFunction) => {
  if (req.user.kycTier === 'TIER_0') {
    return next(new AppError('KYC Verification required to perform this action', 403));
  }
  next();
};