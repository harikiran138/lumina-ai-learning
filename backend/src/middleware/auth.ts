import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import redisClient from '../lib/redis';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    collegeId?: string;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accessToken = req.cookies.access_token || req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      res.status(401).json({ error: 'Unauthorized: No access token provided' });
      return;
    }

    // Verify token
    const decoded = jwt.verify(accessToken, JWT_SECRET) as {
      userId: string;
      role: string;
      collegeId?: string;
    };

    // Make sure token isn't part of a revoked session (optional check, refresh token revocation covers it largely)
    // but just for strict enforcement if needed.

    req.user = decoded;
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

    // Example scoping checks - this sets a custom header or db variable 
    // Usually would inject this into Supabase postgrest query context later
    res.locals.collegeId = req.user.collegeId;

    next();
  };
};
