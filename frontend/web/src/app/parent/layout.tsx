"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import { BGPattern } from "@/components/ui/BGPattern";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { RoleGuard } from "@/components/shared/RoleGuard";
import { InstitutionGuard } from "@/components/shared/InstitutionGuard";
import { useIsAuthLoading } from "@/store/useAuthStore";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isDashboard = pathname === "/parent/dashboard";
  const isAuthLoading = useIsAuthLoading();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["parent"]}>
      <InstitutionGuard>
        <div className={cn(
          "min-h-screen relative overflow-hidden transition-colors duration-700",
          isDashboard ? "bg-[#fdfaf5]" : "bg-black text-gray-100"
        )}>
          <BGPattern
            variant={isDashboard ? "dots" : "grid"}
            size={isDashboard ? 24 : 32}
            fill={isDashboard ? "rgba(140, 120, 81, 0.08)" : "rgba(100, 100, 100, 0.05)"}
            className="fixed inset-0 z-0 pointer-events-none"
          />

          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            variant={isDashboard ? "premium" : "default"}
          />

          <div className="relative z-10">
            <TopNav
              onMenuClick={() => setSidebarOpen(!sidebarOpen)}
              className={cn(
                 "lg:left-24 transition-all duration-500 shadow-none border-b",
                 isDashboard ? "bg-[#fdfaf5]/80 backdrop-blur-md border-[#efe9de] text-[#4a3f35]" : "bg-black/40 border-white/5"
              )}
              variant={isDashboard ? "premium" : "default"}
            />

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            <main
              className="lg:ml-24 pt-20 min-h-screen transition-all duration-500"
            >
              <div className={cn(
                "container mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter",
                isDashboard ? "max-w-[1600px] !p-0 sm:!p-4 lg:!p-8" : "max-w-7xl"
              )}>
                {!isDashboard && <Breadcrumb homeHref="/parent/dashboard" />}
                {children}
              </div>
            </main>
          </div>
        </div>
      </InstitutionGuard>
    </RoleGuard>
  );
}

