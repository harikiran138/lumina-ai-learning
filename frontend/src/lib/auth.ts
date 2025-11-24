'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth as authApi } from './api';
import { jwtDecode } from 'jwt-decode';
import { logError } from './error-logger';
import { handleApiError } from './api-error-handler';

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
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, role?: string) => Promise<void>;
    logout: () => void;
    setUser: (user: User | null) => void;
    clearError: () => void;
}

export const useAuth = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            refreshToken: null,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authApi.login(email, password);
                    const { token, refreshToken } = response;

                    if (!token) {
                        throw new Error('No token received from login');
                    }

                    // Decode token to get user info
                    interface DecodedToken {
                        sub?: string;
                        user_id?: string;
                        name?: string;
                        email?: string;
                        role?: string;
                    }
                    const decoded = jwtDecode<DecodedToken>(token);
                    const user: User = {
                        id: decoded.sub || decoded.user_id || '1',
                        name: decoded.name || email.split('@')[0],
                        email: decoded.email || email,
                        role: decoded.role || ROLES.STUDENT,
                    };

                    set({ user, token, refreshToken, isLoading: false, error: null });
                } catch (error) {
                    const apiError = handleApiError(error, { action: 'login', email });
                    logError(apiError, { action: 'login' });
                    set({ isLoading: false, error: apiError.message });
                    throw apiError;
                }
            },

            register: async (name: string, email: string, password: string, role = ROLES.STUDENT) => {
                set({ isLoading: true, error: null });
                try {
                    await authApi.register(name, email, password, role);
                    // After registration, automatically log in
                    await useAuth.getState().login(email, password);
                } catch (error) {
                    const apiError = handleApiError(error, { action: 'register', email });
                    logError(apiError, { action: 'register' });
                    set({ isLoading: false, error: apiError.message });
                    throw apiError;
                }
            },

            logout: () => {
                set({ user: null, token: null, refreshToken: null, error: null });
            },

            setUser: (user: User | null) => {
                set({ user });
            },

            clearError: () => {
                set({ error: null });
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
