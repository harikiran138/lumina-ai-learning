"use client";

import ThemeToggle from "@/components/ui/ThemeToggle";
import { Bell, Search, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TopNav({
  onMenuClick,
  user = { name: "Student User", role: "Student", initial: "S" },
  className,
}: {
  onMenuClick?: () => void;
  user?: { name: string; role: string; initial: string; avatar?: string };
  className?: string;
}) {
  return (
    <header
      className={cn(
        "fixed top-4 right-4 left-4 lg:left-28 h-16 backdrop-blur-xl bg-black/20 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] z-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between rounded-2xl transition-all duration-300",
        className,
      )}
    >
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          suppressHydrationWarning
          aria-label="Open menu"
          className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 mr-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumina-primary"
        >
          <Menu className="w-6 h-6" aria-hidden="true" />
        </button>
        <div className="relative hidden sm:block w-64">
          <input
            type="text"
            placeholder="Search..."
            suppressHydrationWarning
            aria-label="Search"
            className="w-full pl-10 pr-4 py-2 border border-white/10 rounded-xl bg-white/5 focus-visible:ring-2 focus-visible:ring-lumina-primary/50 focus-visible:border-lumina-primary/50 text-sm text-white placeholder-gray-500 transition-all duration-300 backdrop-blur-sm outline-none"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" aria-hidden="true" />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button
          suppressHydrationWarning
          aria-label="Notifications"
          className="p-2 rounded-xl text-gray-400 hover:text-lumina-primary hover:bg-white/5 transition-all duration-300 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumina-primary"
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" aria-label="New notifications"></span>
        </button>
        <ThemeToggle />
        <div className="flex items-center space-x-3 border-l border-white/10 pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-lumina-primary/80 capitalize">
              {user.role}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-lumina-primary to-amber-600 flex items-center justify-center text-black font-bold shadow-lg shadow-amber-500/20">
            {user.initial}
          </div>
        </div>
      </div>
    </header>
  );
}
