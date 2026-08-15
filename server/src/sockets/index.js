import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { verifyAccessToken } from '../utils/token.js';
import { logger } from '../utils/logger.js';

let io = null;

/* Socket.IO for real-time notifications. Each authenticated user joins a room
   keyed by their id so the server can push targeted notifications. */
export function initSockets(server) {
  io = new Server(server, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(); // allow anonymous connections (no rooms)
    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
    } catch {
      /* ignore bad token — connect anonymously */
    }
    next();
  });

  io.on('connection', (socket) => {
    if (socket.userId) socket.join(`user:${socket.userId}`);
    socket.on('disconnect', () => {});
  });

  logger.info('Socket.IO initialized');
  return io;
}

export function emitToUser(userId, event, payload) {
  if (io && userId) io.to(`user:${userId}`).emit(event, payload);
}

export function broadcast(event, payload) {
  if (io) io.emit(event, payload);
}
