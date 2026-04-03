import { Router } from 'express';
import { authGuard } from '../../shared/middleware/auth.guard';
import { roleGuard } from '../../shared/middleware/role.guard';
import { validate } from '../../shared/middleware/validate';
import {
  CreateOrgSchema, CreateTradePointSchema,
  CreateMenuCategorySchema, CreateMenuItemSchema,
} from './org.schema';
import * as orgService from './org.service';
import * as menuService from './menu.service';

export const orgRouter = Router();

// Public
orgRouter.get('/', async (_req, res, next) => {
  try { res.json(await orgService.listOrgs()); } catch (e) { next(e); }
});

orgRouter.get('/:id/menu', async (req, res, next) => {
  try { res.json(await menuService.getOrgMenu(req.params.id)); } catch (e) { next(e); }
});

// Owner only
orgRouter.use(authGuard, roleGuard('OWNER'));

orgRouter.post('/', validate(CreateOrgSchema), async (req, res, next) => {
  try { res.status(201).json(await orgService.createOrg(req.user!.sub, req.body)); } catch (e) { next(e); }
});

orgRouter.get('/my', async (req, res, next) => {
  try { res.json(await orgService.getMyOrg(req.user!.sub)); } catch (e) { next(e); }
});

orgRouter.post('/:id/trade-points', validate(CreateTradePointSchema), async (req, res, next) => {
  try { res.status(201).json(await orgService.createTradePoint(req.user!.sub, req.params.id, req.body)); } catch (e) { next(e); }
});

orgRouter.post('/:id/categories', validate(CreateMenuCategorySchema), async (req, res, next) => {
  try { res.status(201).json(await menuService.createCategory(req.user!.sub, req.params.id, req.body)); } catch (e) { next(e); }
});

orgRouter.post('/:id/items', validate(CreateMenuItemSchema), async (req, res, next) => {
  try { res.status(201).json(await menuService.createMenuItem(req.user!.sub, req.params.id, req.body)); } catch (e) { next(e); }
});

orgRouter.patch('/items/:itemId/toggle', async (req, res, next) => {
  try { res.json(await menuService.toggleItem(req.user!.sub, req.params.itemId)); } catch (e) { next(e); }
});
