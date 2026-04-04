"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import { BGPattern } from "@/components/ui/BGPattern";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useIsAuthLoading } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const pathname = usePathname();
  const isAuthLoading = useIsAuthLoading();
  const isTutorRoute = pathname?.startsWith("/student/ai_tutor");

  // Dynamic layout offset based on sidebar state
  // Collapsed: left-4 (16px) + w-20 (80px) = 96px (24 units)
  // Expanded: left-4 (16px) + w-64 (256px) = 272px (17rem)
  const offsetClass = isSidebarHovered 
    ? "lg:left-[17rem] lg:ml-[17rem]" 
    : "lg:left-24 lg:ml-24";

  // Hold render until AuthProvider has confirmed the session.
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (isTutorRoute) {
    return <div className="min-h-screen bg-black text-white">{children}</div>;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black text-gray-100">
      <BGPattern
        variant="grid"
        size={32}
        fill="rgba(100, 100, 100, 0.05)"
        className="fixed inset-0 z-0 pointer-events-none"
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isHovering={isSidebarHovered}
        onHoverChange={setIsSidebarHovered}
      />

      <div className="relative z-10">
        <TopNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn("transition-all duration-300", offsetClass)}
        />

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className={cn("pt-20 min-h-screen transition-all duration-300", offsetClass)}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
            <Breadcrumb homeHref="/student/dashboard" />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
