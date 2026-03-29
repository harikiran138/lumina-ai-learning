import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import redisClient from '../lib/redis';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    sessionId: string;
    role: string;
    collegeId?: string;
    email?: string;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accessToken = req.cookies.access_token || req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      res.status(401).json({ error: 'Unauthorized: No access token provided' });
      return;
    }

    // 1. Verify JWT signature and basic structure
    const decoded = jwt.verify(accessToken, JWT_SECRET) as {
      userId: string;
      sessionId: string;
      role: string;
      collegeId?: string;
      email?: string;
    };

    // 2. Validate session in Redis: session:{userId}:{sessionId}
    const sessionKey = `session:${decoded.userId}:${decoded.sessionId}`;
    const sessionData = await redisClient.get(sessionKey);

    if (!sessionData) {
      res.status(401).json({ error: 'Unauthorized: Session expired or revoked' });
      return;
    }

    // 3. Attach session data to request object
    const session = JSON.parse(sessionData);
    req.user = {
      userId: decoded.userId,
      sessionId: decoded.sessionId,
      role: session.role || decoded.role,
      collegeId: session.collegeId || decoded.collegeId,
      email: session.email || decoded.email
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired access token' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: User not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: `Forbidden: Requires one of following roles: ${allowedRoles.join(', ')}` });
      return;
    }

    next();
  };
};

export const requireCollegeScope = () => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: User not authenticated' });
      return;
    }
    res.locals.collegeId = req.user.collegeId;
    next();
  };
};
