import { Router } from 'express';
import { authGuard } from '../../shared/middleware/auth.guard';
import { roleGuard } from '../../shared/middleware/role.guard';
import { validate } from '../../shared/middleware/validate';
import { StartShiftSchema } from './courier.schema';
import * as shiftService from './shift.service';
import * as courierService from './courier.service';

export const courierRouter = Router();

courierRouter.use(authGuard, roleGuard('COURIER'));

courierRouter.post('/shift/start', validate(StartShiftSchema), async (req, res, next) => {
  try { res.status(201).json(await shiftService.startShift(req.user!.sub, req.body)); } catch (e) { next(e); }
});

courierRouter.post('/shift/end', async (req, res, next) => {
  try { res.json(await shiftService.endShift(req.user!.sub)); } catch (e) { next(e); }
});

courierRouter.get('/shift', async (req, res, next) => {
  try { res.json(await shiftService.getActiveShift(req.user!.sub)); } catch (e) { next(e); }
});

courierRouter.get('/stats', async (req, res, next) => {
  try { res.json(await courierService.getCourierStats(req.user!.sub)); } catch (e) { next(e); }
});

courierRouter.get('/orders/active', async (req, res, next) => {
  try { res.json(await courierService.getActiveOrders(req.user!.sub)); } catch (e) { next(e); }
});

courierRouter.get('/orders/history', async (req, res, next) => {
  try { res.json(await courierService.getHistory(req.user!.sub)); } catch (e) { next(e); }
});

courierRouter.get('/orders/available', async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query as Record<string, string>;
    res.json(await courierService.getAvailableOrders(+lat, +lng, +radius || 5));
  } catch (e) { next(e); }
});
