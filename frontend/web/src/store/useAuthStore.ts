import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, type User as ApiUser } from '@/lib/api';

export type Role =
  | "super_admin"
  | "system_admin"
  | "institution_admin"
  | "college_admin"
  | "admin"
  | "hod"
  | "teacher"
  | "student"
  | "parent"
  | "mentor"
  | "peer_tutor"
  | "counselor"
  | "content_creator"
  | "researcher"
  | "alumni";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  collegeId?: string | null;
  deptId?: string | null;
  batchId?: string | null;
  avatar?: string;
  status?: string;
  isActive?: boolean;
  onboardingStep?: number;
  onboardingCompleted?: boolean;
  adaptiveOnboardingCompleted?: boolean;
  mustChangePassword?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** True while any auth operation (hydration, login) is in flight. */
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  login: (identifier: string, password: string, roleHint?: string, collegeId?: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true, // start as loading until AuthProvider hydrates

      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      setLoading: (loading) => set({ isLoading: loading }),
      clearAuth: () => set({ user: null, isAuthenticated: false, isLoading: false }),

      login: async (identifier, password, roleHint?, collegeId?) => {
        set({ isLoading: true });
        try {
          const user = await api.login({ identifier, password, role_hint: roleHint, college_id: collegeId });
          set({ user: user as User, isAuthenticated: true, isLoading: false });
          return user as User;
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
          if (typeof window !== 'undefined') {
            // Clear all auth-related storage
            localStorage.removeItem('lumina_user');
            sessionStorage.clear();
          }
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      refreshUser: async () => {
        set({ isLoading: true });
        try {
          const user = await api.getCurrentUser();
          if (user) {
            set({ user: user as User, isAuthenticated: true, isLoading: false });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'lumina_user',
      // localStorage persists across tabs and browser restarts.
      // The AuthProvider always re-validates against the backend on mount,
      // so stale data is quickly corrected without a flash.
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      // After rehydration from localStorage, keep isLoading=true until
      // AuthProvider finishes its backend check.
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = true;
        }
      },
    }
  )
);

/** Convenience selectors */
export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useIsAuthLoading = () => useAuthStore((s) => s.isLoading);
