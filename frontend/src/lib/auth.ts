import { jwtDecode } from 'jwt-decode';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthToken {
  user_id: string;
  role: string;
  email: string;
  exp: number;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    color?: string;
  } | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: any) => void;
  logout: () => void;
}

// Auth store with persistence
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setTokens: (access: string, refresh: string) => set({ token: access, refreshToken: refresh }),
      setUser: (user: any) => set({ user }),
      logout: () => set({ token: null, refreshToken: null, user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

// Get the current auth token
export const getAuthToken = () => {
  return useAuth.getState().token;
};

// Get the current user
export const getCurrentUser = () => {
  return useAuth.getState().user;
};

// Check if the user is authenticated
export const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode<AuthToken>(token);
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// Get user role
export const getUserRole = () => {
  return useAuth.getState().user?.role;
};

// Role-based access control
export const hasRole = (requiredRole: string | string[]) => {
  const userRole = getUserRole();
  if (!userRole) return false;

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  return userRole === requiredRole;
};

// Role constants
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];