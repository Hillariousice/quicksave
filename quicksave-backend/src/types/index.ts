import { Request } from 'express';
import { User } from '@prisma/client';

// The decoded payload shape stored in our JWTs
export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Extends Express Request so req.user is typed throughout the app
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

// Standard shape for every API response from the Ajo backend
// export interface ApiResponse<T = unknown> {
//   success: boolean;
//   message: string;
//   data?: T;
//   errors?: ValidationError[];
//   meta?: PaginationMeta;
// }

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T; // Data is optional because errors won't have data
  meta?: PaginationMeta;
  errors?: ValidationError[];
  errorCode?: string; // Optional custom code (e.g., "INSUFFICIENT_FUNDS")
}
export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}



// Prisma User without sensitive fields — safe to send in responses
export type SafeUser = Omit<User, 'passwordHash' | 'pin'>;

// Used by Bull job queues throughout the app
export interface ContributionJobData {
  groupId: string;
  userId: string;
  amount: number;
  cycleId: string;
}

export interface PayoutJobData {
  groupId: string;
  recipientId: string;
  amount: number;
  cycleId: string;
}

export interface NotificationJobData {
  userId: string;
  type: 'CONTRIBUTION_DUE' | 'PAYOUT_READY' | 'GROUP_INVITE' | 'PAYMENT_CONFIRMED';
  title: string;
  body: string;
  data?: Record<string, string>;
}