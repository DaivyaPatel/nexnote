import { authenticateToken } from '../middleware/auth.js';

export const setupSocket = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const jwt = (await import('jsonwebtoken')).default;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join workspace rooms
    socket.on('join-workspace', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`User ${socket.userId} joined workspace ${workspaceId}`);
    });

    // Leave workspace rooms
    socket.on('leave-workspace', (workspaceId) => {
      socket.leave(`workspace:${workspaceId}`);
      console.log(`User ${socket.userId} left workspace ${workspaceId}`);
    });

    // Real-time node updates
    socket.on('node-updated', (data) => {
      const { workspaceId, node } = data;
      socket.to(`workspace:${workspaceId}`).emit('node-updated', node);
    });

    // Real-time node creation
    socket.on('node-created', (data) => {
      const { workspaceId, node } = data;
      socket.to(`workspace:${workspaceId}`).emit('node-created', node);
    });

    // Real-time node deletion
    socket.on('node-deleted', (data) => {
      const { workspaceId, nodeId } = data;
      socket.to(`workspace:${workspaceId}`).emit('node-deleted', nodeId);
    });

    // Real-time content updates
    socket.on('content-updated', (data) => {
      const { workspaceId, content } = data;
      socket.to(`workspace:${workspaceId}`).emit('content-updated', content);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};
