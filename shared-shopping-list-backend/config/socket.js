const socketIO = require('socket.io');

let io;

module.exports = {
  init: (httpServer) => {
    io = socketIO(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // Join a household room
      socket.on('join-household', (householdId) => {
        socket.join(householdId);
        console.log(`User joined household: ${householdId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) throw new Error('Socket.io not initialized!');
    return io;
  },
};