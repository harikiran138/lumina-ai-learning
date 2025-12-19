'use server';

import clientPromise from '@/lib/mongodb';
import { User } from '@/lib/api';
import bcrypt from 'bcryptjs';

/**
 * Helper to serialize MongoDB objects
 */
function serializeUser(user: any): User {
    if (!user) return null as any;

    // Create safe user object
    const safeUser: any = {
        id: user._id ? user._id.toString() : user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
        bio: user.bio,
        skills: user.skills,
        location: user.location
    };

    // Helper to plain object
    return JSON.parse(JSON.stringify(safeUser));
}

/**
 * Authenticate user with MongoDB
 * @param email User email
 * @param password User password
 * @returns User object or null if authentication fails
 */
export async function authenticateUser(email: string, password: string): Promise<User | null> {
    // Hardcoded Admin Check
    if (email === 'admin@lumina.com' && password === 'Admin@123') {
        return {
            id: 'static-admin-id',
            email: 'admin@lumina.com',
            name: 'Lumina Admin',
            role: 'admin',
            avatar: 'https://ui-avatars.com/api/?name=Lumina+Admin&background=0D0D0D&color=FFD700',
            status: 'active',
            createdAt: new Date().toISOString(),
            bio: 'System Administrator',
            skills: ['Administration', 'Management'],
            location: 'Lumina HQ'
        };
    }

    // Hardcoded Teacher Check (Fallback)
    if (email === 'teacher@lumina.com' && password === 'teacher123') {
        return {
            id: 'static-teacher-id',
            email: 'teacher@lumina.com',
            name: 'Sarah Teacher',
            role: 'teacher',
            avatar: 'https://ui-avatars.com/api/?name=Sarah+Teacher&background=random',
            status: 'active',
            createdAt: new Date().toISOString(),
            bio: 'Senior Instructor at Lumina',
            skills: ['Teaching', 'Mathematics', 'Science'],
            location: 'Lumina Virtual Campus'
        };
    }

    // Hardcoded Student Check (Fallback)
    if (email === 'student@lumina.com' && password === 'student123') {
        return {
            id: 'static-student-id',
            email: 'student@lumina.com',
            name: 'Alex Student',
            role: 'student',
            avatar: 'https://ui-avatars.com/api/?name=Alex+Student&background=random',
            status: 'active',
            createdAt: new Date().toISOString(),
            bio: 'Enthusiastic Learner',
            skills: ['Coding', 'Design'],
            location: 'Lumina Virtual Campus'
        };
    }

    try {
        const client = await clientPromise;
        const db = client.db("lumina-database");

        const user = await db.collection("users").findOne({ email });

        if (!user) {
            console.log('User not found');
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log('Invalid password');
            return null;
        }

        return serializeUser(user);

    } catch (error: any) {
        console.error('Authentication error:', error);
        return null;
    }
}

/**
 * Register a new user with MongoDB
 * @param userData User registration data
 * @returns User object or error
 */
export async function registerUser(userData: Partial<User> & { password: string }): Promise<User | { error: string }> {
    try {
        const client = await clientPromise;
        const db = client.db("lumina-database");

        const existingUser = await db.collection("users").findOne({ email: userData.email });

        if (existingUser) {
            return { error: 'User already exists' };
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const newUserProfile = {
            email: userData.email || 'temp-user@lumina.com',
            password: hashedPassword,
            name: userData.name || 'New User',
            role: (userData.role === 'teacher' ? 'teacher' : 'student'),
            avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=random`,
            status: 'active',
            createdAt: new Date().toISOString(),
            bio: userData.bio || '',
            skills: userData.skills || [],
            location: userData.location || ''
        };

        const result = await db.collection("users").insertOne(newUserProfile);

        if (!result.acknowledged) {
            return { error: 'Failed to create user' };
        }

        // Return sanitized user object
        return serializeUser({
            ...newUserProfile,
            _id: result.insertedId
        });

    } catch (error: any) {
        console.warn('Registration DB error (falling back to mock user):', error);
        // Fallback: Return a mock user object so the UI can proceed (Demo Mode)
        // Note: This user won't exist in the DB for future logins unless the DB recovers.
        return {
            id: 'temp-mock-id-' + Date.now(),
            email: userData.email!,
            name: userData.name || 'New User',
            role: (userData.role === 'teacher' ? 'teacher' : 'student'),
            avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=random`,
            status: 'active',
            createdAt: new Date().toISOString(),
            bio: userData.bio || '',
            skills: userData.skills || [],
            location: userData.location || ''
        };
    }
}
