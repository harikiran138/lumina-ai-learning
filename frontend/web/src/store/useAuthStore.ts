import { create } from 'zustand';

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Typically true initially until `me` is verified on app load

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  clearAuth: () => set({ user: null, isAuthenticated: false, isLoading: false }),
}));
