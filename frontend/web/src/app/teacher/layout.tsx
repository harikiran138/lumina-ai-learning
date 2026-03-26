"use client";

import TeacherSidebar from "@/components/dashboard/TeacherSidebar";
import TopNav from "@/components/dashboard/TopNav";
import { BGPattern } from "@/components/ui/BGPattern";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await api.getCurrentUser();
      setUser(userData);
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-black text-gray-100">
      <BGPattern
        variant="grid"
        size={32}
        fill="rgba(100, 100, 100, 0.05)"
        className="fixed inset-0 z-0 pointer-events-none"
      />

      <TeacherSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onHoverChange={setIsSidebarExpanded}
      />
      <TopNav
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          isSidebarExpanded ? "lg:left-72" : "lg:left-28",
        )}
        user={
          user
            ? {
                name: user.name,
                role: "Teacher",
                initial: user.name?.charAt(0) || "T",
                avatar: user.avatar,
              }
            : { name: "Teacher", role: "Teacher", initial: "T" }
        }
      />

      {/* Mobile Sidebar Overlay - simplified for now */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main
        className={cn(
          "pt-20 min-h-screen transition-all duration-300",
          isSidebarExpanded ? "lg:ml-72" : "lg:ml-24",
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb />
          {children}
        </div>
      </main>
    </div>
  );
}
