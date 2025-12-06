'use server';

import clientPromise from '@/lib/mongodb';
import { User } from '@/lib/api';
import bcrypt from 'bcryptjs';

/**
 * Authenticate user with MongoDB
 * @param email User email
 * @param password User password
 * @returns User object or null if authentication fails
 */
export async function authenticateUser(email: string, password: string): Promise<User | null> {
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

        // Return user object without sensitive data
        return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            status: user.status,
            createdAt: user.createdAt,
            bio: user.bio,
            skills: user.skills,
            location: user.location
        } as User;

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
            email: userData.email,
            password: hashedPassword,
            name: userData.name || 'New User',
            role: userData.role || 'student',
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

        return {
            id: result.insertedId.toString(),
            ...newUserProfile
        } as unknown as User;

    } catch (error: any) {
        console.error('Registration error:', error);
        return { error: 'Internal server error' };
    }
}
