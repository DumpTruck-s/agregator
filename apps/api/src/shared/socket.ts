import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' },
  });

  io.on('connection', (socket: Socket) => {
    // join order room — покупатель и курьер следят за своим заказом
    socket.on('join:order', (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    // join courier zone — курьер получает новые заказы в своей зоне
    socket.on('join:zone', (zone: string) => {
      socket.join(`courier:available:${zone}`);
    });

    // join support room — пользователь следит за своим чатом с поддержкой
    socket.on('join:support', (userId: string) => {
      socket.join(`support:${userId}`);
    });

    // admin joins global support room for notifications
    socket.on('join:support:admin', () => {
      socket.join('support:admin');
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

export function emitOrderUpdate(orderId: string, payload: unknown) {
  io?.to(`order:${orderId}`).emit('order:updated', payload);
}

export function emitNewOrder(zone: string, payload: unknown) {
  io?.to(`courier:available:${zone}`).emit('order:new', payload);
}

// Emit new message to the user-admin conversation room
export function emitSupportMessage(userId: string, payload: unknown) {
  io?.to(`support:${userId}`).emit('support:message', payload);
}

// Notify admin panel of new incoming user message
export function emitSupportNotify(payload: unknown) {
  io?.to('support:admin').emit('support:notify', payload);
}
