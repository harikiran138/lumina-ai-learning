'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth as authApi } from './api';
import { jwtDecode } from 'jwt-decode';

export const ROLES = {
    STUDENT: 'student',
    TEACHER: 'teacher',
    ADMIN: 'admin',
} as const;

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, role?: string) => Promise<void>;
    logout: () => void;
    setUser: (user: User | null) => void;
}

export const useAuth = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            refreshToken: null,
            isLoading: false,

            login: async (email: string, password: string) => {
                set({ isLoading: true });
                try {
                    const response = await authApi.login(email, password);
                    const { token, refreshToken } = response;

                    // Decode token to get user info
                    const decoded: any = jwtDecode(token);
                    const user: User = {
                        id: decoded.sub || decoded.user_id || '1',
                        name: decoded.name || email.split('@')[0],
                        email: decoded.email || email,
                        role: decoded.role || ROLES.STUDENT,
                    };

                    set({ user, token, refreshToken, isLoading: false });
                } catch (error) {
                    console.error('Login failed:', error);
                    set({ isLoading: false });
                    throw error;
                }
            },

            register: async (name: string, email: string, password: string, role = ROLES.STUDENT) => {
                set({ isLoading: true });
                try {
                    await authApi.register(name, email, password, role);
                    // After registration, automatically log in
                    await useAuth.getState().login(email, password);
                } catch (error) {
                    console.error('Registration failed:', error);
                    set({ isLoading: false });
                    throw error;
                }
            },

            logout: () => {
                set({ user: null, token: null, refreshToken: null });
            },

            setUser: (user: User | null) => {
                set({ user });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
            }),
        }
    )
);
