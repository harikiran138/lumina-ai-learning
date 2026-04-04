"use client";

import { useState } from "react";
import TopNav from "./TopNav";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  SidebarComponent: React.ComponentType<any>;
  homeHref?: string;
  user?: any;
}

export default function DashboardLayout({ 
  children, 
  SidebarComponent, 
  user 
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans selection:bg-highlight-gold/30">
      {/* 1. SIDEBAR: fixed, left-0, top-0, h-full, w-20, z-40 */}
      <SidebarComponent
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isHovering={isSidebarHovered}
        onHoverChange={setIsSidebarHovered}
        // Support both isHovering (generic) and isHovered (faculty/admin) props
        isHovered={isSidebarHovered}
      />

      {/* 2. MAIN WRAPPER: margin-left must match sidebar rail width (ml-20), flex-1 */}
      <div className="flex-1 flex flex-col min-w-0 ml-20 relative">
        
        {/* 3. TOPBAR: fixed, top-0, left-20, right-0, z-30 */}
        <TopNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          className="left-20" // Requirement: left-20 (NOT left-0)
          user={user}
        />

        {/* 4. CONTENT AREA: padding-top must match topbar height (pt-20), px-6 */}
        <main className="flex-1 overflow-y-auto pt-20 px-6 pb-8 transition-all duration-300 relative z-10">
           {children}
        </main>

        {/* Mobile Toggle Overlay */}
        <div 
          className={cn(
            "fixed inset-0 bg-black/60 z-30 transition-opacity lg:hidden",
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setSidebarOpen(false)}
        />
      </div>
    </div>
  );
}
