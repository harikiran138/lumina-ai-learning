/**
 * Lumina Auth Store (Zustand)
 * ---------------------------
 * This module re-exports from useAuthStore to avoid having two separate
 * store instances. All auth state lives in useAuthStore.ts.
 */
export { useAuthStore, useUser, useIsAuthenticated, type User, type Role } from './useAuthStore';
