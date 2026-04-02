import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import { connectRedis } from './lib/redis';

dotenv.config();

const app = express();
const PORT = process.env.AUTH_PORT || 4000;

const allowedOrigins = [
  'https://lumina-ai-blond.vercel.app',
  'https://lumina-platform.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];
const allowedOriginPatterns = [
  /^https:\/\/lumina-[a-z0-9-]+\.vercel\.app$/i,
];

function isAllowedOrigin(origin?: string) {
  const frontendUrl = process.env.FRONTEND_URL;
  return (
    !origin ||
    allowedOrigins.includes(origin) ||
    origin === frontendUrl ||
    allowedOriginPatterns.some((pattern) => pattern.test(origin))
  );
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // required for cookies
}));
app.use(express.json());
app.use(cookieParser());
app.options('*', cors({
  origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
  credentials: true,
}));

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
