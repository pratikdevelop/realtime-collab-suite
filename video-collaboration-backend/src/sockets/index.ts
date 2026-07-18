import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { registerRoomHandlers } from './roomHandler';

export function initSockets(server: HttpServer, clientUrl: string) {
  const io = new Server(server, {
    cors: {
      origin: clientUrl,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);
    
    // Register our modular handlers
    registerRoomHandlers(io, socket);
  });

  return io;
}