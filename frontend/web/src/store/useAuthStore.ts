import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Role = "super_admin" | "college_admin" | "admin" | "hod" | "faculty" | "teacher" | "student" | "parent" | "mentor" | "peer_tutor" | "counselor" | "content_creator" | "researcher" | "alumni";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  collegeId?: string | null;
  avatar?: string;
  isActive?: boolean;
  onboardingStep?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setUser: (user: User | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      clearAuth: () => set({ user: null, isAuthenticated: false, isLoading: false }),
    }),
    {
      name: 'lumina-auth-cache',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : ({} as Storage),
      ),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
