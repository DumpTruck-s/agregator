import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../errors';
import { prisma } from '../prisma';
import type { JwtPayload } from '@delivery/shared';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function authGuard(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new UnauthorizedError());

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    // Check if user is blocked
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { isBlocked: true } });
    if (!user || user.isBlocked) return next(new ForbiddenError('Account is blocked'));
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError());
  }
}
