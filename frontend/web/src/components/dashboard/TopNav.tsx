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
        isPremium 
          ? "bg-[#fdfaf5]/60 backdrop-blur-md border-b border-[#efe9de] text-[#4a3f35]" 
          : "bg-background/85 backdrop-blur-2xl border-b border-border text-foreground shadow-[0_4px_30px_rgba(17,24,39,0.08)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)]",
        className,
      )}
    >


      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          suppressHydrationWarning
          aria-label="Open menu"
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-secondary mr-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              "w-full pl-10 pr-4 py-2 border rounded-xl transition-all duration-300 backdrop-blur-sm outline-none text-sm",
              isPremium 
                ? "bg-[#8c7851]/5 border-[#efe9de] text-[#4a3f35] placeholder-[#c4b5a2] focus:border-[#8c7851] focus:bg-white" 
                : "bg-background/90 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary"
            )}
          />
          <Search className={cn(
            "absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4",
            isPremium ? "text-[#b8a994]" : "text-muted-foreground"
          )} aria-hidden="true" />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button
          suppressHydrationWarning
          aria-label="Notifications"
          className={cn(
            "p-2 rounded-xl transition-all duration-300 relative focus-visible:outline-none focus-visible:ring-2",
            isPremium 
              ? "text-[#8c7851] hover:bg-[#8c7851]/5 focus-visible:ring-[#8c7851]" 
              : "text-muted-foreground hover:text-primary hover:bg-secondary focus-visible:ring-ring"
          )}
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" aria-label="New notifications"></span>
        </button>
        <ThemeToggle />
        <div className={cn(
          "flex items-center space-x-3 border-l pl-4",
          isPremium ? "border-[#efe9de]" : "border-white/10"
        )}>
          <div className="text-right hidden sm:block">
            <p className={cn(
            "text-sm font-medium",
              isPremium ? "text-[#4a3f35]" : "text-foreground"
            )}>{user.name}</p>
            <p className={cn(
              "text-xs capitalize",
              isPremium ? "text-[#8c7851]/80" : "text-primary/80"
            )}>
              {user.role}
            </p>
          </div>
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-lg border transition-all duration-500",
            isPremium 
              ? "bg-[#8c7851] text-white border-[#8c7851]/20 shadow-[#8c7851]/20 hover:scale-105" 
              : "bg-gradient-to-br from-primary to-accent text-primary-foreground border-primary/20 shadow-primary/20 hover:scale-105"
          )}>
            {user.initial}
          </div>
        </div>
      </div>

    </header>
  );
}
