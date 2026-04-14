"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import { BGPattern } from "@/components/ui/BGPattern";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useState } from "react";
import { useAuthStore, useIsAuthLoading } from "@/store/useAuthStore";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { InstitutionGuard } from "@/components/shared/InstitutionGuard";

export default function MentorLayout({ children }: { children: React.ReactNode }) {
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

  const mappedUser = user
  ? { name: user.name ?? "Mentor", role: "Mentor", initial: (user.name ?? "M").charAt(0), avatar: user.avatar }
  : { name: "Mentor", role: "Mentor", initial: "M" };

  return (
    <RoleGuard allowedRoles={["mentor"]}>
      <InstitutionGuard>
        <div className="min-h-screen relative overflow-hidden bg-black text-gray-100">
          <BGPattern
            variant="grid"
            size={32}
            fill="rgba(100, 100, 100, 0.05)"
            className="fixed inset-0 z-0 pointer-events-none opacity-20"
          />
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="relative z-10">
            <TopNav
              onMenuClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:left-24 transition-all duration-500"
              user={mappedUser}
            />
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <main className="lg:ml-24 pt-20 min-h-screen transition-all duration-500">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
                <Breadcrumb homeHref="/mentor/dashboard" />
                {children}
              </div>
            </main>
          </div>
        </div>
      </InstitutionGuard>
    </RoleGuard>
  );
}
