"use client";

import HODSidebar from "@/components/dashboard/HODSidebar";
import TopNav from "@/components/dashboard/TopNav";
import { BGPattern } from "@/components/ui/BGPattern";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useState } from "react";
import { useAuthStore, useIsAuthLoading } from "@/store/useAuthStore";

export default function HODLayout({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen relative overflow-hidden bg-black text-gray-100">
      <BGPattern
        variant="grid"
        size={32}
        fill="rgba(100, 100, 100, 0.05)"
        className="fixed inset-0 z-0 pointer-events-none"
      />

      {/* Sidebar expands as CSS overlay on hover — never pushes content */}
      <HODSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <TopNav
        onMenuClick={() => setSidebarOpen((v) => !v)}
        className="lg:left-24 transition-all duration-500"
        user={
          user
            ? { name: user.name ?? "HOD", role: "HOD", initial: (user.name ?? "H").charAt(0), avatar: user.avatar }
            : { name: "HOD", role: "HOD", initial: "H" }
        }
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Stable margin — never shifts on hover */}
      <main className="lg:ml-24 pt-20 min-h-screen transition-all duration-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
          <Breadcrumb />
          {children}
        </div>
      </main>
    </div>
  );
}
