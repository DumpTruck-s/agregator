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
