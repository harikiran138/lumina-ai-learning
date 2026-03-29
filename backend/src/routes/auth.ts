import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase';
import redisClient from '../lib/redis';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_dev_only';

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
    // Determine the user via the custom Postgres RPC
    const { data: userRef, error: rpcError } = await supabase.rpc('resolve_login_identifier', {
      p_identifier: identifier,
      p_college_id: college_id || null, // Optional scoping
    });

    if (rpcError || !userRef || userRef.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const { out_user_id: userId, out_role: dbRole } = userRef[0];

    // Verify role if provided
    if (role_hint && role_hint !== dbRole) {
      res.status(401).json({ error: 'Role mismatch' });
      return;
    }

    // Get the password hash
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, password_hash, college_id, email, is_active')
      .eq('id', userId)
      .single();

    if (userError || !userRecord || !userRecord.is_active) {
      res.status(401).json({ error: 'Account disabled or invalid' });
      return;
    }

    // Verify bcrypt password
    const isMatch = await bcrypt.compare(password, userRecord.password_hash);
    if (!isMatch) {
      // Record failed attempt could go here
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Issue tokens
    const accessToken = jwt.sign(
      { userId, role: dbRole, collegeId: userRecord.college_id },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Save refresh token in Redis (e.g., set user ID as key, token as value, or vice-versa)
    // Here we use token as key and userId as value to easily check validity
    await redisClient.setEx(`refresh_token:${refreshToken}`, 7 * 24 * 60 * 60, userId);

    res.cookie('access_token', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      success: true,
      user: {
        id: userId,
        email: userRecord.email,
        role: dbRole,
        collegeId: userRecord.college_id
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
    // Validate against payload
    const decoded = jwt.verify(refresh_token, REFRESH_SECRET) as { userId: string };
    
    // Validate against Redis cache
    const storedUserId = await redisClient.get(`refresh_token:${refresh_token}`);
    if (!storedUserId || storedUserId !== decoded.userId) {
       res.status(401).json({ error: 'Invalid refresh session' });
       return;
    }

    const { data: userRecord, error } = await supabase
      .from('users')
      .select('id, role, college_id')
      .eq('id', decoded.userId)
      .single();
      
    if (error || !userRecord) {
       res.status(401).json({ error: 'User lookup failed' });
       return;
    }

    // Issue new access token
    const newAccessToken = jwt.sign(
      { userId: userRecord.id, role: userRecord.role, collegeId: userRecord.college_id },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    // Rotate refresh token (optional, but highly recommended)
    const newRefreshToken = jwt.sign(
      { userId: userRecord.id },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    await redisClient.del(`refresh_token:${refresh_token}`);
    await redisClient.setEx(`refresh_token:${newRefreshToken}`, 7 * 24 * 60 * 60, userRecord.id);

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
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, college_id, avatar, is_active')
      .eq('id', req.user!.userId)
      .single();

    if (error || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
