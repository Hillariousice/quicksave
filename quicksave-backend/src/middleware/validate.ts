import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { sendError } from '../utils/response';

export const validate = (schema: z.ZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body, query, and params against the provided Zod schema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Map Zod errors into our standardized ValidationError shape
        const formattedErrors = error.issues.map((err: any) => ({
          field: err.path.join('.'), // e.g., "body.email"
          message: err.message,
        }));

        return sendError(res, 'Validation failed', 400, formattedErrors, 'VALIDATION_ERROR');
      }
      return next(error);
    }
  };
};