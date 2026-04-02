const express = require('express');
const proxy = require('express-http-proxy');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'lumina-secret-key-2024';

const allowedOrigins = [
  'https://lumina-ai-blond.vercel.app',
  'https://lumina-platform.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
];

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const envFrontend = process.env.FRONTEND_URL;
    if (!origin || allowedOrigins.includes(origin) || origin === envFrontend) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Auth Helper: Convert Cookie to Bearer Token for Backend
const attachAuthToken = (proxyReqOpts, srcReq) => {
  const token = srcReq.cookies['session_token'];
  if (token) {
    proxyReqOpts.headers['Authorization'] = `Bearer ${token}`;
  }
  return proxyReqOpts;
};

// 1. Auth Proxy (Intercept Login/Refresh to set cookies)
app.use('/api/auth', proxy(BACKEND_URL, {
  proxyReqPathResolver: (req) => {
    return `/api/auth${req.url}`;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    if (userReq.path === '/login' || userReq.path === '/refresh' || userReq.path === '/register') {
      try {
        const data = JSON.parse(proxyResData.toString('utf8'));
        if (data.accessToken) {
          // Set secure HttpOnly cookie
          userRes.cookie('session_token', data.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });
          // Remove sensitive token from JSON body returned to frontend (Phase 3 hardening)
          // Actually, we can keep it as a fallback, but the Gateway will prefer the cookie.
        }
      } catch (err) {
        console.error('Failed to parse auth response:', err);
      }
    }
    if (userReq.path === '/logout') {
      userRes.clearCookie('session_token');
    }
    return proxyResData;
  }
}));

// 2. Onboarding Status (Custom gateway endpoint)
app.get('/api/onboarding/status', async (req, res) => {
  const token = req.cookies['session_token'];
  if (!token) return res.status(401).json({ detail: "Not authenticated" });
  
  try {
    // We could verify JWT here or just proxy to backend and let it verify.
    // Proxying is cleaner for this specific micro-gateway.
    res.redirect(`${BACKEND_URL}/api/onboarding/status`);
  } catch (err) {
    res.status(500).json({ detail: "Gateway error" });
  }
});

// 3. Generic API Proxy (Appends Auth from Cookie)
app.use('/api', proxy(BACKEND_URL, {
  proxyReqOptDecorator: attachAuthToken,
  proxyReqPathResolver: (req) => {
    return `/api${req.url}`;
  }
}));

// Health check
app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`Lumina API Gateway running on port ${PORT}`);
  console.log(`Proxying to Backend: ${BACKEND_URL}`);
});
