import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}

export interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        return null;
    }
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    return prisma.session.create({
        data: {
            userId,
            token,
            expiresAt,
        },
    });
}

/**
 * Validate a session token
 */
export async function validateSession(token: string) {
    const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!session) return null;
    if (session.expiresAt < new Date()) {
        await prisma.session.delete({ where: { id: session.id } });
        return null;
    }

    return session;
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(token: string) {
    await prisma.session.deleteMany({ where: { token } });
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions() {
    await prisma.session.deleteMany({
        where: {
            expiresAt: {
                lt: new Date(),
            },
        },
    });
}
