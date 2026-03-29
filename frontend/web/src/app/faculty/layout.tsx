"use client";

import FacultySidebar from "@/components/dashboard/FacultySidebar";
import TopNav from "@/components/dashboard/TopNav";
import { BGPattern } from "@/components/ui/BGPattern";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen relative overflow-hidden bg-black text-gray-100">
      <BGPattern
        variant="grid"
        size={32}
        fill="rgba(100, 100, 100, 0.05)"
        className="fixed inset-0 z-0 pointer-events-none"
      />

      {/* Sidebar expands as CSS overlay on hover — never pushes content */}
      <FacultySidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* TopNav: fixed left offset = sidebar collapsed width (5rem) + gap (1rem left) = ~6rem = 24 units */}
      <TopNav
        onMenuClick={() => setSidebarOpen((v) => !v)}
        className="lg:left-28"
        user={
          user
            ? { name: user.name ?? "Faculty", role: "Faculty", initial: (user.name ?? "F").charAt(0), avatar: user.avatar }
            : { name: "Faculty", role: "Faculty", initial: "F" }
        }
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main: stable margin — never shifts on sidebar hover */}
      <main className="lg:ml-28 pt-20 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
          <Breadcrumb />
          {children}
        </div>
      </main>
    </div>
  );
}
