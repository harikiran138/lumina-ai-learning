"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import { BGPattern } from "@/components/ui/BGPattern";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = usePathname();
  const isTutorRoute = pathname?.startsWith("/student/ai_tutor");

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
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      <div className="relative z-10">
        <TopNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(isCollapsed ? "lg:left-24" : "lg:left-72")}
        />

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main
          className={cn(
            "pt-20 min-h-screen transition-all duration-300",
            isCollapsed ? "lg:ml-24" : "lg:ml-72",
          )}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumb homeHref="/student/dashboard" />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
