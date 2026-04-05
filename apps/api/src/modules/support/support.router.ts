import { Router } from 'express';
import { authGuard } from '../../shared/middleware/auth.guard';
import { roleGuard } from '../../shared/middleware/role.guard';
import * as service from './support.service';

export const supportRouter = Router();

supportRouter.use(authGuard);

// ── User routes ─────────────────────────────────────────────────────────────
// Any logged-in (non-admin) user can access their own chat
supportRouter.get('/messages', async (req, res, next) => {
  try { res.json(await service.getUserMessages(req.user!.sub)); } catch (e) { next(e); }
});

supportRouter.post('/messages', async (req, res, next) => {
  try {
    const { text } = req.body;
    res.status(201).json(await service.sendUserMessage(req.user!.sub, text));
  } catch (e) { next(e); }
});

// ── Admin routes ─────────────────────────────────────────────────────────────
supportRouter.get('/admin/chats', roleGuard('ADMIN'), async (req, res, next) => {
  try { res.json(await service.getAdminChats()); } catch (e) { next(e); }
});

supportRouter.get('/admin/unread', roleGuard('ADMIN'), async (req, res, next) => {
  try { res.json({ count: await service.getTotalUnread() }); } catch (e) { next(e); }
});

supportRouter.get('/admin/chats/:userId', roleGuard('ADMIN'), async (req, res, next) => {
  try { res.json(await service.getAdminChat(req.params.userId)); } catch (e) { next(e); }
});

supportRouter.post('/admin/chats/:userId', roleGuard('ADMIN'), async (req, res, next) => {
  try {
    const { text } = req.body;
    res.status(201).json(await service.sendAdminMessage(req.params.userId, text, req.user!.sub));
  } catch (e) { next(e); }
});
