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

const ownerOnly = [authGuard, roleGuard('OWNER')] as const;

// ─── Public ───────────────────────────────────────────────────────────────────

orgRouter.get('/', async (_req, res, next) => {
  try { res.json(await orgService.listOrgs()); } catch (e) { next(e); }
});

orgRouter.get('/:id/menu', async (req, res, next) => {
  try { res.json(await menuService.getOrgMenu(req.params.id)); } catch (e) { next(e); }
});

// /my должен быть ДО /:id — иначе Express посчитает "my" как id
orgRouter.get('/my', ...ownerOnly, async (req, res, next) => {
  try { res.json(await orgService.getMyOrg(req.user!.sub)); } catch (e) { next(e); }
});

orgRouter.get('/:id', async (req, res, next) => {
  try { res.json(await orgService.getOrgById(req.params.id)); } catch (e) { next(e); }
});

// ─── Owner only ───────────────────────────────────────────────────────────────

orgRouter.post('/', ...ownerOnly, validate(CreateOrgSchema), async (req, res, next) => {
  try { res.status(201).json(await orgService.createOrg(req.user!.sub, req.body)); } catch (e) { next(e); }
});

orgRouter.patch('/:id', ...ownerOnly, async (req, res, next) => {
  try { res.json(await orgService.updateOrg(req.user!.sub, req.params.id, req.body)); } catch (e) { next(e); }
});

orgRouter.post('/:id/trade-points', ...ownerOnly, validate(CreateTradePointSchema), async (req, res, next) => {
  try { res.status(201).json(await orgService.createTradePoint(req.user!.sub, req.params.id, req.body)); } catch (e) { next(e); }
});

orgRouter.delete('/trade-points/:tpId', ...ownerOnly, async (req, res, next) => {
  try { res.json(await orgService.deleteTradePoint(req.user!.sub, req.params.tpId)); } catch (e) { next(e); }
});

orgRouter.post('/:id/categories', ...ownerOnly, validate(CreateMenuCategorySchema), async (req, res, next) => {
  try { res.status(201).json(await menuService.createCategory(req.user!.sub, req.params.id, req.body)); } catch (e) { next(e); }
});

orgRouter.delete('/categories/:catId', ...ownerOnly, async (req, res, next) => {
  try { res.json(await menuService.deleteCategory(req.user!.sub, req.params.catId)); } catch (e) { next(e); }
});

orgRouter.post('/:id/items', ...ownerOnly, validate(CreateMenuItemSchema), async (req, res, next) => {
  try { res.status(201).json(await menuService.createMenuItem(req.user!.sub, req.params.id, req.body)); } catch (e) { next(e); }
});

orgRouter.patch('/items/:itemId', ...ownerOnly, async (req, res, next) => {
  try { res.json(await menuService.updateMenuItem(req.user!.sub, req.params.itemId, req.body)); } catch (e) { next(e); }
});

orgRouter.delete('/items/:itemId', ...ownerOnly, async (req, res, next) => {
  try { res.json(await menuService.deleteMenuItem(req.user!.sub, req.params.itemId)); } catch (e) { next(e); }
});

orgRouter.patch('/items/:itemId/toggle', ...ownerOnly, async (req, res, next) => {
  try { res.json(await menuService.toggleItem(req.user!.sub, req.params.itemId)); } catch (e) { next(e); }
});
