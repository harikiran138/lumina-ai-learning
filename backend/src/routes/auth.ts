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

function normalizeRole(role: string | null | undefined): string {
  if (role === 'teacher') return 'faculty';
  if (role === 'admin') return 'super_admin';
  return role || 'student';
}

function toDatabaseRole(role: string | null | undefined): string {
  if (role === 'faculty') return 'teacher';
  if (role === 'super_admin') return 'admin';
  return role || 'student';
}

function resolveIdentifierColumn(identifier: string): 'email' | 'roll_number' | 'employee_id' {
  if (/^\d{2}NU\dA\d{4}$/.test(identifier)) return 'roll_number';
  if (/^(FAC|HOD|ADM)\d{3}$/.test(identifier)) return 'employee_id';
  return 'email';
}

async function issueSessionTokens(user: {
  id: string;
  role: string;
  college_id?: string | null;
  email?: string | null;
  name?: string | null;
  onboarding_step?: number | null;
}) {
  const sessionId = uuidv4();
  const normalizedRole = normalizeRole(user.role);
  const onboardingCompleted = (user.onboarding_step || 0) >= 5;

  const sessionData = {
    role: normalizedRole,
    collegeId: user.college_id || null,
    email: user.email || null,
    name: user.name || null,
    onboardingCompleted,
  };

  await redisClient.set(
    `session:${user.id}:${sessionId}`,
    JSON.stringify(sessionData),
    { EX: SESSION_EXPIRY }
  );

  const accessToken = jwt.sign(
    {
      userId: user.id,
      sessionId,
      role: normalizedRole,
      collegeId: user.college_id || null,
      onboardingCompleted,
      email: user.email || null,
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, sessionId },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  await redisClient.set(`refresh_token:${refreshToken}`, user.id, { EX: SESSION_EXPIRY });

  return { accessToken, refreshToken, normalizedRole };
}

// 1. POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password, full_name, name, role } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const displayName = typeof full_name === 'string' && full_name.trim()
    ? full_name.trim()
    : typeof name === 'string'
      ? name.trim()
      : '';
  const requestedRole = typeof role === 'string' ? role.trim().toLowerCase() : 'student';
  const databaseRole = toDatabaseRole(requestedRole);

  if (!normalizedEmail || !password || !displayName) {
    res.status(400).json({ error: 'Email, password, and full name are required' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long' });
    return;
  }

  if (!['student', 'teacher', 'faculty'].includes(requestedRole)) {
    res.status(400).json({ error: 'Signup is only available for student and faculty accounts' });
    return;
  }

  try {
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUserError) {
      console.error('Register lookup error:', existingUserError);
      res.status(500).json({ error: 'Failed to validate signup request' });
      return;
    }

    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { data: createdUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: normalizedEmail,
        name: displayName,
        full_name: displayName,
        role: databaseRole,
        password_hash: passwordHash,
        phone: 'N/A',
        status: 'active',
        is_active: true,
        onboarding_step: 0,
      })
      .select('id, email, name, full_name, role, college_id, dept_id, batch_id, onboarding_step, must_change_password, profile_photo_url, status, created_at')
      .single();

    if (createError || !createdUser) {
      console.error('Register create error:', createError);
      res.status(500).json({ error: 'Failed to create account' });
      return;
    }

    res.status(201).json({
      success: true,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.full_name || createdUser.name,
        role: normalizeRole(createdUser.role),
        collegeId: createdUser.college_id,
        deptId: createdUser.dept_id,
        batchId: createdUser.batch_id,
        onboardingStep: createdUser.onboarding_step,
        mustChangePassword: createdUser.must_change_password || false,
        profilePhotoUrl: createdUser.profile_photo_url,
        status: createdUser.status || 'active',
        created_at: createdUser.created_at,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { identifier, password, role_hint, college_id } = req.body;
  const normalizedIdentifier = typeof identifier === 'string' ? identifier.trim() : '';

  if (!normalizedIdentifier || !password) {
    res.status(400).json({ error: 'Identifier and password are required' });
    return;
  }

  try {
    // 🔍 Resolve user via RPC when available, otherwise fall back to direct lookup.
    const { data: userRef, error: rpcError } = await supabase.rpc('resolve_login_identifier', {
      p_identifier: normalizedIdentifier,
      p_college_id: college_id || null,
    });

    let userId: string | null = null;
    let rawRole: string | null = null;

    if (userRef && userRef.length > 0) {
      userId = userRef[0].out_user_id;
      rawRole = userRef[0].out_role;
    } else {
      const identifierColumn = resolveIdentifierColumn(normalizedIdentifier);
      const lookupValue = identifierColumn === 'email'
        ? normalizedIdentifier.toLowerCase()
        : normalizedIdentifier;
      const { data: directUser, error: directLookupError } = await supabase
        .from('users')
        .select('id, role')
        .eq(identifierColumn, lookupValue)
        .maybeSingle();

      if (directLookupError) {
        console.warn('Direct login lookup fallback failed:', directLookupError);
      }

      if (directUser) {
        userId = directUser.id;
        rawRole = directUser.role;
      }
    }

    if (!userId || !rawRole) {
      if (rpcError) {
        console.warn('Login RPC unavailable, fallback lookup also failed:', rpcError);
      }
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const dbRole = normalizeRole(rawRole);

    if (role_hint && role_hint !== dbRole) {
      res.status(401).json({ error: 'Role mismatch' });
      return;
    }

    // 🔐 Get full user data
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, password_hash, college_id, email, name, full_name, is_active, onboarding_step, dept_id, batch_id, must_change_password, profile_photo_url, status, created_at')
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

    const { accessToken, refreshToken } = await issueSessionTokens({
      id: userId,
      role: rawRole,
      college_id: userRecord.college_id,
      email: userRecord.email,
      name: userRecord.full_name || userRecord.name,
      onboarding_step: userRecord.onboarding_step,
    });

    res.cookie('access_token', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      success: true,
      accessToken,
      user: {
        id: userId,
        email: userRecord.email,
        name: userRecord.full_name || userRecord.name,
        role: dbRole,
        collegeId: userRecord.college_id,
        deptId: userRecord.dept_id,
        batchId: userRecord.batch_id,
        onboardingStep: userRecord.onboarding_step,
        mustChangePassword: userRecord.must_change_password || false,
        profilePhotoUrl: userRecord.profile_photo_url,
        status: userRecord.status || 'active',
        created_at: userRecord.created_at,
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. POST /api/auth/refresh
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

    res.json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// 4. POST /api/auth/logout
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

// 5. GET /api/auth/me
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
