"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import { BGPattern } from "@/components/ui/BGPattern";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useIsAuthLoading } from "@/store/useAuthStore";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isAuthLoading = useIsAuthLoading();
  const isTutorRoute = pathname?.startsWith("/student/ai_tutor");

  // Hold render until AuthProvider has confirmed the session.
  // The middleware already gate-keeps the route, so this is purely to
  // prevent a flash of un-authed UI on the client before hydration finishes.
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
      />

      <div className="relative z-10">
        <TopNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:left-24 transition-all duration-500"
        />

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="lg:ml-24 pt-20 min-h-screen transition-all duration-500">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
            <Breadcrumb homeHref="/student/dashboard" />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
