const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { logger } = require('../shared/config/logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication token required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info('Socket connected', { userId: socket.userId });
    socket.join(`user_${socket.userId}`);
    socket.on('subscribe:dashboard', () => {
      socket.join(`dashboard_${socket.userId}`);
      socket.emit('dashboard:subscribed', { message: 'Subscribed to live dashboard' });
    });
    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { userId: socket.userId, reason });
    });
  });

  return io;
};

const emitToUser = (userId, event, data) => {
  if (io) io.to(`user_${userId}`).emit(event, data);
};

const emitDashboardUpdate = (userId, data) => {
  if (io) io.to(`dashboard_${userId}`).emit('dashboard:update', data);
};

const getIO = () => io;

module.exports = { initSocket, emitToUser, emitDashboardUpdate, getIO };
