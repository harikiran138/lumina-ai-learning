import { create } from 'zustand';

export type Role = 'student' | 'faculty' | 'hod' | 'college_admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  collegeId?: string;
  avatar?: string;
  isActive?: boolean;
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
