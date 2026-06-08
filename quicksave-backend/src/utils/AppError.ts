export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    // Operational errors are predictable (e.g., user input wrong password)
    // Non-operational errors are bugs (e.g., database goes down)
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}