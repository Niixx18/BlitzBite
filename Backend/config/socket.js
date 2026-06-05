const { Server } = require('socket.io');

let io;
const userSockets = new Map(); // userId string -> socketId string

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Socket.io user connected:', socket.id);

    // Register user ID with their socket connection
    socket.on('register', (userId) => {
      if (userId) {
        userSockets.set(String(userId), socket.id);
        console.log(`Socket registered user ${userId} to socket ID ${socket.id}`);
      }
    });

    // Handle joining a tracking room for a specific order
    socket.on('joinOrder', (orderId) => {
      if (orderId) {
        socket.join(String(orderId));
        console.log(`Socket ${socket.id} joined tracking room for order ${orderId}`);
      }
    });

    // Handle leaving a tracking room for a specific order
    socket.on('leaveOrder', (orderId) => {
      if (orderId) {
        socket.leave(String(orderId));
        console.log(`Socket ${socket.id} left tracking room for order ${orderId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket.io user disconnected:', socket.id);
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`Socket deregistered user ${userId}`);
          break;
        }
      }
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet.');
  }
  return io;
};

const sendToUser = (userId, event, data) => {
  if (io) {
    const socketId = userSockets.get(String(userId));
    if (socketId) {
      io.to(socketId).emit(event, data);
    }
  }
};

const sendToOrderRoom = (orderId, event, data) => {
  if (io) {
    io.to(String(orderId)).emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIo,
  sendToUser,
  sendToOrderRoom
};
