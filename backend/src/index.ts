import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import { connectRedis } from './lib/redis';

dotenv.config();

const app = express();
const PORT = process.env.AUTH_PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // required for cookies
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-node' });
});

// Start server
const startServer = async () => {
  try {
    // Connect Redis before accepting traffic
    await connectRedis();
    
    app.listen(PORT, () => {
      console.log(`Lumina Auth Node server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
