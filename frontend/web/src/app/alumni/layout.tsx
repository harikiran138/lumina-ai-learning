"use client";

import AlumniSidebar from "@/components/dashboard/AlumniSidebar";
import TopNav from "@/components/dashboard/TopNav";
import { BGPattern } from "@/components/ui/BGPattern";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useState } from "react";
import { useAuthStore, useIsAuthLoading } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

import { RoleGuard } from "@/components/shared/RoleGuard";
import { InstitutionGuard } from "@/components/shared/InstitutionGuard";

export default function AlumniLayout({ children }: { children: React.ReactNode }) {
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

  return (
    <RoleGuard allowedRoles={["alumni"]}>
      <InstitutionGuard>
        <div className="min-h-screen relative overflow-hidden bg-black text-gray-100">
          <BGPattern
            variant="grid"
            size={32}
            fill="rgba(100, 100, 100, 0.05)"
            className="fixed inset-0 z-0 pointer-events-none"
          />

          <AlumniSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isHovering={isSidebarHovered}
            onHoverChange={setIsSidebarHovered}
          />

          <TopNav
            onMenuClick={() => setSidebarOpen((v) => !v)}
            className={cn(
              "transition-all duration-300 ease-in-out",
              isSidebarHovered ? "lg:left-72" : "lg:left-24"
            )}
            user={
              user
                ? { name: user.name ?? "Alumni", role: "Alumni", initial: (user.name ?? "A").charAt(0), avatar: user.avatar }
                : { name: "Alumni", role: "Alumni", initial: "A" }
            }
          />

          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <main className={cn(
            "pt-20 min-h-screen transition-all duration-300 ease-in-out",
            isSidebarHovered ? "lg:ml-72" : "lg:ml-24"
          )}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
              <Breadcrumb />
              {children}
            </div>
          </main>
        </div>
      </InstitutionGuard>
    </RoleGuard>
  );
}
