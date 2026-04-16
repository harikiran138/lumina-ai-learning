"use client";

import { useState } from "react";
import TopNav from "./TopNav";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  SidebarComponent: React.ComponentType<any>;
  homeHref?: string;
  user?: any;
  /** Tailwind margin/left class matching the sidebar's left offset + collapsed width.
   *  left-0 sidebars (w-20)  → "20"  (default)
   *  left-4 sidebars (w-20)  → "24"  (left-4 + w-20 = 96px)
   */
  sidebarOffset?: "20" | "24";
}

export default function DashboardLayout({
  children,
  SidebarComponent,
  user,
  sidebarOffset = "20",
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary/20 selection:text-foreground">
      {/* 1. SIDEBAR: fixed, left-0, top-0, h-full, w-20, z-40 */}
      <SidebarComponent
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isHovering={isSidebarHovered}
        onHoverChange={setIsSidebarHovered}
        // Support both isHovering (generic) and isHovered (faculty/admin) props
        isHovered={isSidebarHovered}
      />

      {/* 2. MAIN WRAPPER: margin-left shifts content to clear sidebar (only on lg screens) */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-w-0 relative transition-all duration-300 ease-in-out", 
          sidebarOffset === "24"
            ? (isSidebarHovered ? "lg:ml-[272px] ml-0" : "lg:ml-24 ml-0")
            : (isSidebarHovered ? "lg:ml-64 ml-0" : "lg:ml-20 ml-0")
        )}
      >

        {/* 3. TOPBAR: fixed, top-0, right-0, z-30 — left must match main wrapper offset (only on lg screens) */}
        <TopNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            "transition-all duration-300 ease-in-out",
            sidebarOffset === "24"
              ? (isSidebarHovered ? "lg:left-[272px] left-0" : "lg:left-24 left-0")
              : (isSidebarHovered ? "lg:left-64 left-0" : "lg:left-20 left-0")
          )}
          user={user}
        />

        {/* 4. CONTENT AREA: padding-top must match topbar height (pt-20), px-6 */}
        <main className="flex-1 overflow-y-auto pt-20 px-6 pb-8 relative z-0">
           {children}
        </main>

        {/* Mobile Toggle Overlay */}
        <div 
          className={cn(
            "fixed inset-0 bg-black/40 dark:bg-black/60 z-30 transition-opacity lg:hidden",
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setSidebarOpen(false)}
        />
      </div>
    </div>
  );
}
