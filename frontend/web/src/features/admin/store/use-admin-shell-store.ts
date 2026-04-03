"use client";

import { create } from "zustand";

import type { AdminShellStats, AdminUser } from "@/features/admin/types";

interface AdminShellState {
  sidebarOpen: boolean;
  user: AdminUser | null;
  adminStats: AdminShellStats | null;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setUser: (user: AdminUser | null) => void;
  setAdminStats: (stats: AdminShellStats | null) => void;
}

export const useAdminShellStore = create<AdminShellState>((set) => ({
  sidebarOpen: false,
  user: null,
  adminStats: null,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setUser: (user) => set({ user }),
  setAdminStats: (adminStats) => set({ adminStats }),
}));

