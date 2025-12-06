'use server';

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    UserCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase-config';
import {
    COLLECTIONS,
    createDocument,
    findDocumentByField,
    updateDocument
} from '@/lib/firebase';
import { User } from '@/lib/api';

/**
 * Authenticate user with Firebase Auth
 * @param email User email
 * @param password User password
 * @returns User object or null if authentication fails
 */
export async function authenticateUser(email: string, password: string): Promise<User | null> {
    try {
        // Sign in with Firebase Auth
        const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        if (!firebaseUser) {
            console.log('Firebase authentication failed');
            return null;
        }

        // Fetch user profile from Firestore
        const userProfile = await findDocumentByField<User>(
            COLLECTIONS.USERS,
            'email',
            email
        );

        if (!userProfile) {
            console.log('User profile not found in Firestore');
            return null;
        }

        // Return user object without sensitive data
        return {
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.name,
            role: userProfile.role,
            avatar: userProfile.avatar,
            status: userProfile.status,
            createdAt: userProfile.createdAt
        } as User;

    } catch (error: any) {
        console.error('Authentication error:', error.code, error.message);
        return null;
    }
}

/**
 * Register a new user with Firebase Auth
 * @param userData User registration data
 * @returns User object or error
 */
export async function registerUser(userData: Partial<User> & { password: string }): Promise<User | { error: string }> {
    try {
        // Check if user already exists in Firestore
        const existingUser = await findDocumentByField(
            COLLECTIONS.USERS,
            'email',
            userData.email
        );

        if (existingUser) {
            return { error: 'User already exists' };
        }

        // Create user in Firebase Auth
        const userCredential: UserCredential = await createUserWithEmailAndPassword(
            auth,
            userData.email!,
            userData.password
        );

        const firebaseUser = userCredential.user;

        if (!firebaseUser) {
            return { error: 'Failed to create Firebase user' };
        }

        // Prepare user profile for Firestore
        const newUserProfile = {
            email: userData.email,
            name: userData.name || 'New User',
            role: userData.role || 'student',
            avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=random`,
            status: 'active',
            createdAt: new Date().toISOString(),
            bio: userData.bio || '',
            skills: userData.skills || [],
            location: userData.location || ''
        };

        // Store user profile in Firestore using Firebase UID as document ID
        const result = await createDocument(
            COLLECTIONS.USERS,
            newUserProfile,
            firebaseUser.uid
        );

        if (!result.success) {
            return { error: 'Failed to create user profile' };
        }

        return {
            id: firebaseUser.uid,
            ...newUserProfile
        } as User;

    } catch (error: any) {
        console.error('Registration error:', error.code, error.message);

        // Handle specific Firebase errors
        if (error.code === 'auth/email-already-in-use') {
            return { error: 'Email already in use' };
        } else if (error.code === 'auth/invalid-email') {
            return { error: 'Invalid email address' };
        } else if (error.code === 'auth/weak-password') {
            return { error: 'Password is too weak' };
        }

        return { error: 'Internal server error' };
    }
}
