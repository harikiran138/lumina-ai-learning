"use client";

import TeacherSidebar from "@/components/dashboard/TeacherSidebar";
import TopNav from "@/components/dashboard/TopNav";
import { BGPattern } from "@/components/ui/BGPattern";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useState } from "react";
import { useAuthStore, useIsAuthLoading } from "@/store/useAuthStore";

import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const isAuthLoading = useIsAuthLoading();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  const mappedUser = user
  ? { name: user.name ?? "Teacher", role: "Teacher", initial: (user.name ?? "T").charAt(0), avatar: user.avatar }
  : { name: "Teacher", role: "Teacher", initial: "T" };

  return (
    <DashboardLayout SidebarComponent={TeacherSidebar} user={mappedUser}>
      <BGPattern
        variant="grid"
        size={32}
        fill="rgba(100, 100, 100, 0.05)"
        className="fixed inset-0 z-0 pointer-events-none opacity-20"
      />
      <div className="py-10 page-enter relative z-10">
        <Breadcrumb />
        {children}
      </div>
    </DashboardLayout>
  );
}
