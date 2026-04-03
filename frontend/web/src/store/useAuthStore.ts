import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, type User as ApiUser } from '@/lib/api';

export type Role = "super_admin" | "college_admin" | "admin" | "hod" | "faculty" | "teacher" | "student" | "parent" | "mentor" | "peer_tutor" | "counselor" | "content_creator" | "researcher" | "alumni";

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
  mustChangePassword?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
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
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
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
          if (typeof window !== "undefined") {
            sessionStorage.removeItem('lumina_user');
            // Hard clear for sensitive sessions
            sessionStorage.clear();
          }
          set({ user: null, isAuthenticated: false });
        }
      },

      refreshUser: async () => {
        try {
          const user = await api.getCurrentUser();
          if (user) {
            set({ user: user as User, isAuthenticated: true });
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'lumina_user',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

/** Convenience selectors */
export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
