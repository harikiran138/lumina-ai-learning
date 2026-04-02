"use client";

import AlumniSidebar from "@/components/dashboard/AlumniSidebar";
import TopNav from "@/components/dashboard/TopNav";
import { BGPattern } from "@/components/ui/BGPattern";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export default function AlumniLayout({ children }: { children: React.ReactNode }) {
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

      <AlumniSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <TopNav
        onMenuClick={() => setSidebarOpen((v) => !v)}
        className="lg:left-24 transition-all duration-500"
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

      <main className="lg:ml-24 pt-20 min-h-screen transition-all duration-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
          <Breadcrumb />
          {children}
        </div>
      </main>
    </div>
  );
}
