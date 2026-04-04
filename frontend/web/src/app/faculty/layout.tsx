"use client";

import FacultySidebar from "@/components/dashboard/FacultySidebar";
import TopNav from "@/components/dashboard/TopNav";
import { BGPattern } from "@/components/ui/BGPattern";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useState } from "react";
import { useAuthStore, useIsAuthLoading } from "@/store/useAuthStore";

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();
  const isAuthLoading = useIsAuthLoading();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-gray-100">
      {/* Background pattern — fixed so it never scrolls or overlaps content */}
      <BGPattern
        variant="grid"
        size={32}
        fill="rgba(100, 100, 100, 0.05)"
        className="fixed inset-0 z-0 pointer-events-none"
      />

      {/* Fixed sidebar — never pushes main content */}
      <FacultySidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* TopNav: fixed, offset by collapsed sidebar width (6rem on lg+) */}
      <TopNav
        onMenuClick={() => setSidebarOpen((v) => !v)}
        className="lg:left-[76px] transition-all duration-300"
        user={
          user
            ? { name: user.name ?? "Faculty", role: "Faculty", initial: (user.name ?? "F").charAt(0), avatar: user.avatar }
            : { name: "Faculty", role: "Faculty", initial: "F" }
        }
      />

      {/* Main content — fixed left margin matching sidebar collapsed width */}
      <main className="flex-1 lg:ml-[76px] pt-24 min-h-screen relative z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-10 page-enter">
          <Breadcrumb />
          {children}
        </div>
      </main>
    </div>
  );
}
