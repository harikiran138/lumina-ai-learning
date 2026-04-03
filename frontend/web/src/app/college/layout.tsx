"use client";

import CollegeSidebar from "@/components/dashboard/CollegeSidebar";
import TopNav from "@/components/dashboard/TopNav";
import { BGPattern } from "@/components/ui/BGPattern";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useState } from "react";
import { useAuthStore, useIsAuthLoading } from "@/store/useAuthStore";

export default function CollegeLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Use the global store — AuthProvider already hydrates this from the backend.
  // This replaces the previous local api.getCurrentUser() useEffect which
  // was creating a redundant, racy second API call.
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

      <CollegeSidebar />
      <TopNav
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:left-24 transition-all duration-500"
        user={
          user
            ? {
                name: user.name,
                role: "College Admin",
                initial: user.name?.charAt(0) || "C",
                avatar: user.avatar,
              }
            : { name: "College", role: "College Admin", initial: "C" }
        }
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="lg:ml-24 pt-20 min-h-screen transition-all duration-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb />
          {children}
        </div>
      </main>
    </div>
  );
}
