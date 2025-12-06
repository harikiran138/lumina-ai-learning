'use server';

import clientPromise from '@/lib/mongodb';
import { User } from '@/lib/api';

const DB_NAME = 'test'; // Update if using a different DB name
const COLLECTION_NAME = 'users';

export async function authenticateUser(email: string, password: string): Promise<User | null> {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Find user by email
        const user = await db.collection(COLLECTION_NAME).findOne({ email });

        if (!user) {
            console.log('User not found:', email);
            return null;
        }

        // Verify password
        // WARNING: In production, passwords must be hashed (e.g., using bcrypt).
        // Since we seeded plain text passwords, we compare directly for now.
        if (user.password !== password) {
            console.log('Invalid password for:', email);
            return null;
        }

        // Return user object without sensitive data
        const { password: _, _id, ...userProfile } = user;

        return {
            id: _id.toString(),
            ...userProfile
        } as User;

    } catch (error) {
        console.error('Authentication error:', error);
        return null;
    }
}

export async function registerUser(userData: Partial<User> & { password: string }): Promise<User | { error: string }> {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Check if user already exists
        const existingUser = await db.collection(COLLECTION_NAME).findOne({ email: userData.email });
        if (existingUser) {
            return { error: 'User already exists' };
        }

        // Prepare new user document
        const newUser = {
            ...userData,
            createdAt: new Date().toISOString(),
            status: 'active',
            // Assign default avatar if missing
            avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=random`
        };

        // Insert into DB
        const result = await db.collection(COLLECTION_NAME).insertOne(newUser);

        if (!result.acknowledged) {
            return { error: 'Failed to create user' };
        }

        const { password, ...createdUser } = newUser;
        return {
            id: result.insertedId.toString(),
            ...createdUser
        } as User;

    } catch (error) {
        console.error('Registration error:', error);
        return { error: 'Internal server error' };
    }
}
