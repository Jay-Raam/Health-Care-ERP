import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { logger } from '../logs/logger.js';

let ioInstance: Server | null = null;

export const initSocketServer = (httpServer: HttpServer): Server => {
  if (ioInstance) return ioInstance;

  ioInstance = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Authentication Middleware for Sockets
  ioInstance.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      
      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as any;
      socket.data.user = decoded; // { id, email, role }
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  ioInstance.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    logger.info({ socketId: socket.id, userId: user?.id, role: user?.role }, 'Socket connected and authenticated');

    // Join a room specific to the authenticated user
    if (user?.id) {
      socket.join(`user:${user.id}`);
    }

    // If doctor, join doctors group
    if (user?.role === 'DOCTOR') {
      socket.join('doctors');
    }

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id, userId: user?.id }, 'Socket disconnected');
    });
  });

  return ioInstance;
};

export const getSocketServer = (): Server => {
  if (!ioInstance) {
    throw new Error('Socket.IO is not initialized!');
  }
  return ioInstance;
};

// Real-time broadcast helpers
export const emitToUser = (userId: string, event: string, data: any): void => {
  try {
    const io = getSocketServer();
    io.to(`user:${userId}`).emit(event, data);
    logger.debug({ userId, event }, 'Socket event emitted to user room');
  } catch (error: any) {
    logger.warn(`Failed to emit socket to user room: ${error.message}`);
  }
};

export const emitToAll = (event: string, data: any): void => {
  try {
    const io = getSocketServer();
    io.emit(event, data);
    logger.debug({ event }, 'Socket event broadcasted to all');
  } catch (error: any) {
    logger.warn(`Failed to broadcast socket event: ${error.message}`);
  }
};

export const emitToDoctors = (event: string, data: any): void => {
  try {
    const io = getSocketServer();
    io.to('doctors').emit(event, data);
  } catch (error: any) {
    logger.warn(`Failed to emit socket to doctors room: ${error.message}`);
  }
};
