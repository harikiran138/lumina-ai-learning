import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import redisClient from '../lib/redis';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_dev_only';

const SESSION_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

// Configure cookie options based on environment
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

// 1. POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { identifier, password, role_hint, college_id } = req.body;

  if (!identifier || !password) {
    res.status(400).json({ error: 'Identifier and password are required' });
    return;
  }

  try {
    // 🔍 Resolve user via RPC
    const { data: userRef, error: rpcError } = await supabase.rpc('resolve_login_identifier', {
      p_identifier: identifier,
      p_college_id: college_id || null,
    });

    if (rpcError || !userRef || userRef.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const { out_user_id: userId, out_role: rawRole } = userRef[0];
    
    // Normalize role
    let dbRole = rawRole;
    if (rawRole === 'teacher') dbRole = 'faculty';
    if (rawRole === 'admin') dbRole = 'super_admin';

    if (role_hint && role_hint !== dbRole) {
      res.status(401).json({ error: 'Role mismatch' });
      return;
    }

    // 🔐 Get full user data
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, password_hash, college_id, email, name, is_active, onboarding_step')
      .eq('id', userId)
      .single();

    if (userError || !userRecord || !userRecord.is_active) {
      res.status(401).json({ error: 'Account disabled or invalid' });
      return;
    }

    // 🔑 Password check
    const isMatch = await bcrypt.compare(password, userRecord.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // 🧠 Create Session in Redis
    const sessionId = uuidv4();
    const onboardingCompleted = (userRecord.onboarding_step || 0) >= 5;
    
    const sessionData = {
      role: dbRole,
      collegeId: userRecord.college_id,
      email: userRecord.email,
      name: userRecord.name,
      onboardingCompleted
    };

    await redisClient.set(
      `session:${userId}:${sessionId}`,
      JSON.stringify(sessionData),
      { EX: SESSION_EXPIRY }
    );

    // 🔐 Issue JWT (Access Token contains sessionId)
    const accessToken = jwt.sign(
      { 
        userId, 
        sessionId,
        role: dbRole, 
        collegeId: userRecord.college_id,
        onboardingCompleted,
        email: userRecord.email
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId, sessionId },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Save refresh token link in Redis (optional, but good for rotation tracking)
    await redisClient.set(`refresh_token:${refreshToken}`, userId, { EX: SESSION_EXPIRY });

    res.cookie('access_token', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      success: true,
      user: {
        id: userId,
        email: userRecord.email,
        name: userRecord.name,
        role: dbRole,
        collegeId: userRecord.college_id,
        onboardingStep: userRecord.onboarding_step
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { refresh_token } = req.cookies;

  if (!refresh_token) {
    res.status(401).json({ error: 'Refresh token missing' });
    return;
  }

  try {
    const decoded = jwt.verify(refresh_token, REFRESH_SECRET) as { userId: string, sessionId: string };
    
    // Validate against Redis cache
    const storedUserId = await redisClient.get(`refresh_token:${refresh_token}`);
    if (!storedUserId || storedUserId !== decoded.userId) {
       res.status(401).json({ error: 'Invalid refresh session' });
       return;
    }

    // Check if original session still exists
    const sessionKey = `session:${decoded.userId}:${decoded.sessionId}`;
    const sessionData = await redisClient.get(sessionKey);
    if (!sessionData) {
      res.status(401).json({ error: 'Session expired or revoked' });
      return;
    }

    const session = JSON.parse(sessionData);
    
    // Rotate Session ID for security
    const newSessionId = uuidv4();
    await redisClient.del(sessionKey);
    await redisClient.set(
      `session:${decoded.userId}:${newSessionId}`,
      JSON.stringify(session),
      { EX: SESSION_EXPIRY }
    );

    // Issue new tokens
    const newAccessToken = jwt.sign(
      { 
        userId: decoded.userId, 
        sessionId: newSessionId,
        role: session.role, 
        collegeId: session.collegeId,
        onboardingCompleted: session.onboardingCompleted,
        email: session.email
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const newRefreshToken = jwt.sign(
      { userId: decoded.userId, sessionId: newSessionId },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    await redisClient.del(`refresh_token:${refresh_token}`);
    await redisClient.set(`refresh_token:${newRefreshToken}`, decoded.userId, { EX: SESSION_EXPIRY });

    res.cookie('access_token', newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// 3. POST /api/auth/logout
router.post('/logout', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { refresh_token } = req.cookies;
  
  if (req.user) {
    // Revoke specific session in Redis
    await redisClient.del(`session:${req.user.userId}:${req.user.sessionId}`);
  }
  
  if (refresh_token) {
     await redisClient.del(`refresh_token:${refresh_token}`);
  }

  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  
  res.json({ success: true });
});

// 4. GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Return data directly from the verified Redis session for speed,
    // or fetch fresh from DB if needed. Here we return session data + ID.
    res.json({
      user: {
        id: req.user!.userId,
        role: req.user!.role,
        collegeId: req.user!.collegeId,
        email: req.user!.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
export default router;
