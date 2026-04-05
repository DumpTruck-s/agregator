import { Router } from 'express';
import { authGuard } from '../../shared/middleware/auth.guard';
import { validate } from '../../shared/middleware/validate';
import { CreateOrderSchema, UpdateOrderStatusSchema } from './order.schema';
import * as service from './order.service';
import type { Role } from '@delivery/shared';

export const orderRouter = Router();

orderRouter.use(authGuard);

orderRouter.post('/', validate(CreateOrderSchema), async (req, res, next) => {
  try {
    res.status(201).json(await service.createOrder(req.user!.sub, req.body));
  } catch (e) { next(e); }
});

orderRouter.get('/my', async (req, res, next) => {
  try { res.json(await service.getMyOrders(req.user!.sub)); } catch (e) { next(e); }
});

orderRouter.get('/org', async (req, res, next) => {
  try { res.json(await service.getOrgOrders(req.user!.sub)); } catch (e) { next(e); }
});

orderRouter.patch('/:id/status', validate(UpdateOrderStatusSchema), async (req, res, next) => {
  try {
    res.json(await service.updateStatus(
      req.params.id,
      req.body,
      req.user!.sub,
      req.user!.role as Role,
    ));
  } catch (e) { next(e); }
});

orderRouter.post('/:id/rate', async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    res.json(await service.rateOrder(req.params.id, req.user!.sub, rating));
  } catch (e) { next(e); }
});
