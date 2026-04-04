"use client";

import FacultySidebar from "@/components/dashboard/FacultySidebar";
import TopNav from "@/components/dashboard/TopNav";
import { BGPattern } from "@/components/ui/BGPattern";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useState } from "react";
import { useAuthStore, useIsAuthLoading } from "@/store/useAuthStore";

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const { user } = useAuthStore();
  const isAuthLoading = useIsAuthLoading();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  // Dynamic layout offsets synchronized with sidebar width (w-20 vs w-64)
  const offsetClass = isSidebarHovered ? "lg:left-64 lg:ml-64" : "lg:left-20 lg:ml-20";

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
        isHovered={isSidebarHovered}
        onHoverChange={setIsSidebarHovered}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* TopNav: fixed, offset by collapsed sidebar width (5rem / 80px) or expanded width (16rem / 256px) */}
      <TopNav
        onMenuClick={() => setSidebarOpen((v) => !v)}
        className={`${offsetClass.split(" ")[0]} transition-all duration-300`}
        user={
          user
            ? { name: user.name ?? "Faculty", role: "Faculty", initial: (user.name ?? "F").charAt(0), avatar: user.avatar }
            : { name: "Faculty", role: "Faculty", initial: "F" }
        }
      />

      {/* Main content — fixed left margin matching sidebar width */}
      <main className={`flex-1 ${offsetClass.split(" ")[1]} pt-20 min-h-screen relative z-10 transition-all duration-300`}>
        <div className="px-4 sm:px-6 py-10 page-enter">
          <Breadcrumb />
          {children}
        </div>
      </main>
    </div>
  );
}
