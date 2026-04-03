import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors';
import type { JwtPayload } from '@delivery/shared';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authGuard(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new UnauthorizedError();

  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    next();
  } catch {
    throw new UnauthorizedError();
  }
}
