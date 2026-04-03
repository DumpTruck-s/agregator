import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors';
import type { Role } from '@delivery/shared';

export function roleGuard(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as Role)) {
      throw new ForbiddenError();
    }
    next();
  };
}
