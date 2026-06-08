import { Response } from 'express';
import { ApiResponse, PaginationMeta, ValidationError } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: PaginationMeta
): Response => {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
    // Conditionally add meta if it was provided (useful for paginated lists)
    ...(meta && { meta }), 
  };

  return res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  message = 'An error occurred',
  statusCode = 400,
  errors?: ValidationError[],
  errorCode?: string
): Response => {
  const payload: ApiResponse<null> = {
    success: false,
    message,
    // Conditionally add detailed validation errors or specific error codes if provided
    ...(errors && errors.length > 0 && { errors }),
    ...(errorCode && { errorCode }),
  };

  return res.status(statusCode).json(payload);
};