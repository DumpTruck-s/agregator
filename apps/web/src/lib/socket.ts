import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, { autoConnect: false });
  }
  return socket;
}

export function connectSocket() {
  getSocket().connect();
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function joinOrderRoom(orderId: string) {
  getSocket().emit('join:order', orderId);
}

export function joinZone(zone: string) {
  getSocket().emit('join:zone', zone);
}
