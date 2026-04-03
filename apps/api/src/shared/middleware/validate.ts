import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../errors';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(result.error.errors.map(e => e.message).join(', '), 422);
    }
    req.body = result.data;
    next();
  };
}
