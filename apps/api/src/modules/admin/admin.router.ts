import { Router } from 'express';
import { authGuard } from '../../shared/middleware/auth.guard';
import { roleGuard } from '../../shared/middleware/role.guard';
import * as service from './admin.service';

export const adminRouter = Router();

const adminOnly = [authGuard, roleGuard('ADMIN')] as const;

adminRouter.get('/orgs', ...adminOnly, async (_req, res, next) => {
  try { res.json(await service.listAllOrgs()); } catch (e) { next(e); }
});

adminRouter.patch('/orgs/:id/verify', ...adminOnly, async (req, res, next) => {
  try { res.json(await service.verifyOrg(req.params.id)); } catch (e) { next(e); }
});

adminRouter.patch('/orgs/:id/deactivate', ...adminOnly, async (req, res, next) => {
  try { res.json(await service.deactivateOrg(req.params.id)); } catch (e) { next(e); }
});

adminRouter.patch('/orgs/:id/activate', ...adminOnly, async (req, res, next) => {
  try { res.json(await service.activateOrg(req.params.id)); } catch (e) { next(e); }
});

adminRouter.get('/couriers', ...adminOnly, async (_req, res, next) => {
  try { res.json(await service.listCouriers()); } catch (e) { next(e); }
});
