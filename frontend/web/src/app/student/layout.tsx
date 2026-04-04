"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import { BGPattern } from "@/components/ui/BGPattern";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useIsAuthLoading } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthLoading = useIsAuthLoading();
  const isTutorRoute = pathname?.startsWith("/student/ai_tutor");

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
    <DashboardLayout SidebarComponent={Sidebar}>
      <BGPattern
        variant="grid"
        size={32}
        fill="rgba(100, 100, 100, 0.05)"
        className="fixed inset-0 z-0 pointer-events-none opacity-20"
      />
      <div className="container mx-auto py-8 page-enter relative z-10">
        <Breadcrumb homeHref="/student/dashboard" />
        {children}
      </div>
    </DashboardLayout>
  );
}
