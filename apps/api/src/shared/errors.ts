import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code?: string,
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super('Unauthorized', 401, 'UNAUTHORIZED');
  }
}

// Express error handler — регистрируй последним в app.ts
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message, code: err.code });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}
