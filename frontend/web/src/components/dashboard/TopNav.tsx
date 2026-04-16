"use client";

import ThemeToggle from "@/components/ui/ThemeToggle";
import { Bell, Search, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TopNav({
  onMenuClick,
  user = { name: "Student User", role: "Student", initial: "S" },
  className,
  variant = "default",
}: {
  onMenuClick?: () => void;
  user?: { name: string; role: string; initial: string; avatar?: string };
  className?: string;
  variant?: "default" | "premium";
}) {
  const isPremium = variant === "premium";

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-16 transition-all duration-300 z-30 px-6 flex items-center justify-between",
        "bg-surface/80 backdrop-blur-md border-b border-border text-text shadow-sm dark:shadow-md",
        className,
      )}
    >
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          suppressHydrationWarning
          aria-label="Open menu"
          className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-surface-elevated mr-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Menu className="w-6 h-6" aria-hidden="true" />
        </button>
        <div className="relative hidden sm:block w-64">
          <input
            type="text"
            placeholder="Search..."
            suppressHydrationWarning
            aria-label="Search"
            className={cn(
              "w-full pl-10 pr-4 py-2 border border-border rounded-xl transition-all duration-300 outline-none text-sm",
              "bg-surface text-text placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary"
            )}
          />
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button
          suppressHydrationWarning
          aria-label="Notifications"
          className={cn(
            "p-2 rounded-xl transition-all duration-300 relative focus-visible:outline-none focus-visible:ring-2",
            "text-text-secondary hover:text-primary hover:bg-surface-elevated focus-visible:ring-primary"
          )}
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full shadow-lg" aria-label="New notifications"></span>
        </button>
        <ThemeToggle />
        <div className="flex items-center space-x-3 border-l border-border pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-text">{user.name}</p>
            <p className="text-xs capitalize text-text-secondary">
              {user.role}
            </p>
          </div>
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-lg border transition-all duration-500",
            "bg-primary text-primary-foreground border-primary/20 hover:scale-105"
          )}>
            {user.initial}
          </div>
        </div>
      </div>

    </header>
  );
}
