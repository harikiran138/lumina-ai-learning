"use client";

import { useEffect, useState } from "react";

import AdminSidebar from "@/components/dashboard/AdminSidebar";
import TopNav from "@/components/dashboard/TopNav";
import { BGPattern } from "@/components/ui/BGPattern";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { api, type User } from "@/lib/api";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await api.getCurrentUser();
        setUser(userData);
      } catch {
        // user stays null; fallback shown in TopNav
      }
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

      <AdminSidebar />
      <TopNav
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        user={
          user
            ? {
                name: user.name,
                role: "Administrator",
                initial: user.name?.charAt(0) || "A",
                avatar: user.avatar,
              }
            : { name: "Admin", role: "Administrator", initial: "A" }
        }
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="lg:ml-24 pt-20 min-h-screen transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb />
          {children}
        </div>
      </main>
    </div>
  );
}
