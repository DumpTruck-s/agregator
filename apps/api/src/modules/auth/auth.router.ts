import { Router } from 'express';
import { validate } from '../../shared/middleware/validate';
import { authGuard } from '../../shared/middleware/auth.guard';
import { RegisterSchema, LoginSchema } from './auth.schema';
import * as service from './auth.service';

export const authRouter = Router();

authRouter.post('/register', validate(RegisterSchema), async (req, res, next) => {
  try {
    res.status(201).json(await service.register(req.body));
  } catch (e) { next(e); }
});

authRouter.post('/login', validate(LoginSchema), async (req, res, next) => {
  try {
    res.json(await service.login(req.body));
  } catch (e) { next(e); }
});

authRouter.get('/me', authGuard, (req, res) => {
  res.json(req.user);
});
