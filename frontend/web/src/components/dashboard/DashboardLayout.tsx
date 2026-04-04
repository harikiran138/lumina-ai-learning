"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  homeHref: string;
}

export default function DashboardLayout({ children, homeHref }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Requirement: Sidebar is w-20 (rail) or w-64 (expanded)
  // Requirement: Main wrapper must have ml-20 to clear sidebar rail
  // Requirement: TopNav must have left-20 to clear sidebar rail
  
  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans">
      {/* 1. SIDEBAR: fixed, left-0, top-0, h-full, w-20, z-40 */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isHovering={isSidebarHovered}
        onHoverChange={setIsSidebarHovered}
      />

      {/* 2. MAIN WRAPPER: margin-left must match sidebar width (ml-20), flex-1 */}
      <div className="flex-1 flex flex-col min-w-0 ml-20 relative">
        
        {/* 3. TOPBAR: fixed, top-0, left-20, right-0, z-30 */}
        <TopNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          className="left-20" // Explicitly ensure it clears the rail
        />

        {/* 4. CONTENT AREA: padding-top must match topbar height (pt-20), px-6 */}
        <main className="flex-1 overflow-y-auto pt-20 px-6 pb-8 transition-all duration-300">
           {children}
        </main>

        {/* Mobile Toggle Overlay (Only for small screens if sidebar uses translate) */}
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
