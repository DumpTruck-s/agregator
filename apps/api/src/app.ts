import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initSocket } from './shared/socket';
import { errorHandler } from './shared/errors';
import { authRouter } from './modules/auth/auth.router';
import { orgRouter } from './modules/org/org.router';
import { orderRouter } from './modules/order/order.router';
import { courierRouter } from './modules/courier/courier.router';
import { adminRouter } from './modules/admin/admin.router';
import { uploadRouter } from './modules/upload/upload.router';
import { supportRouter } from './modules/support/support.router';

const app = express();
const httpServer = createServer(app);

initSocket(httpServer);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/orgs', orgRouter);
app.use('/api/orders', orderRouter);
app.use('/api/courier', courierRouter);
app.use('/api/admin', adminRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/support', supportRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
