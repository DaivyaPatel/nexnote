import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import nodeRoutes from './routes/nodes.js';
import contentRoutes from './routes/content.js';
import workspaceRoutes from './routes/workspaces.js';
import linkRoutes from './routes/links.js';
import sessionRoutes from './routes/sessions.js';
import inviteRoutes from './routes/invites.js';
import { setupSocket } from './socket/index.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL || 'https://your-frontend-domain.com' 
      : 'http://localhost:5173',
    credentials: true,
  },
});

// Setup Socket.io
setupSocket(io);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL || 'https://your-frontend-domain.com' 
    : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/invites', inviteRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NexNote API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`NexNote server running on port ${PORT}`);
});
