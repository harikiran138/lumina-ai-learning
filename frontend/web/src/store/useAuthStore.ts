import { create } from 'zustand';


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
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  clearAuth: () => set({ user: null, isAuthenticated: false, isLoading: false }),
}));
