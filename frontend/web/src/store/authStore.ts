/**
 * Lumina Auth Store (Zustand)
 * ---------------------------
 * Central auth state consumed by every role layout and page.
 * Syncs with the existing RealAPI login/logout methods.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api, type User } from "@/lib/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Actions
  setUser: (user: User | null) => void;
  login: (identifier: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) =>
    set({ user, isAuthenticated: user !== null }),

  login: async (identifier: string, password: string) => {
    set({ isLoading: true });
    try {
      const user = await api.login(identifier, password);
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {
      // ignore network errors on logout
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },

  refreshUser: async () => {
    try {
      const user = await api.getCurrentUser();
      if (user) {
        set({ user, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },
}));

/** Convenience selector — avoids re-subscribing to the full store */
export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
