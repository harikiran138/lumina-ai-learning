"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  LogOut,
  X,
  Bell,
  GraduationCap,
  Network,
  BarChart3,
  Timer,
  Zap,
  AlertOctagon,
  Star,
  CheckSquare,
  BookMarked,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

const navItems = [
  { name: "Dashboard",          href: "/hod/dashboard",          icon: LayoutDashboard },
  { name: "Knowledge Graph",    href: "/hod/knowledge-graph",    icon: Network },
  { name: "Faculty Performance",href: "/hod/faculty-performance",icon: BarChart3 },
  { name: "Syllabus Tracker",   href: "/hod/syllabus-tracker",   icon: CheckSquare },
  { name: "AI SLA Monitor",     href: "/hod/sla-monitor",        icon: Timer },
  { name: "Interventions",      href: "/hod/interventions",      icon: Zap },
  { name: "At-Risk Students",   href: "/hod/at-risk",            icon: AlertOctagon },
  { name: "Alumni Feedback",    href: "/hod/alumni-feedback",    icon: Star },
  { name: "Alert Center",       href: "/hod/alerts",             icon: Bell },
  { name: "Faculty Management", href: "/hod/teachers",           icon: Users },
  { name: "Program Management", href: "/hod/programs",           icon: GraduationCap },
  { name: "Curriculum Map",     href: "/hod/curriculum",         icon: BookOpen },
];

export default function HODSidebar({
  isOpen,
  onClose,
  isHovering,
  onHoverChange,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  isHovering?: boolean;
  onHoverChange?: (hovered: boolean) => void;
}) {
  const pathname = usePathname();
  const router   = useRouter();

  const { user: storeUser, setUser: setStoreUser, clearAuth } = useAuthStore();
  const [user, setUser] = useState<any>(storeUser ?? null);
  const notificationCount = 5;

  useEffect(() => {
    if (storeUser) { setUser(storeUser); return; }
    api.getCurrentUser().then((data) => {
      if (data) { setUser(data); setStoreUser(data as any); }
    });
  }, [storeUser, setStoreUser]);

  const handleLogout = useCallback(async () => {
    await api.logout();
    clearAuth();
    router.push("/login");
  }, [clearAuth, router]);

  return (
    <aside
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className={cn(
        "fixed left-4 top-4 bottom-4 glass-v2-gold border-white/5 shadow-premium z-50 flex flex-col transition-all duration-300 ease-in-out",
        isHovering ? "w-64" : "w-20",
        isOpen
          ? "translate-x-0 bg-black/95 w-64 flex"
          : "-translate-x-[120%] lg:translate-x-0 hidden lg:flex",
      )}
    >
      {/* ── Logo header ── */}
      <div className={cn(
        "flex items-center border-b border-white/5 shrink-0 transition-all duration-300",
        isHovering ? "h-20 px-6" : "h-16 px-4 justify-center"
      )}>
        <Link href="/" className="font-display font-black text-2xl flex items-center select-none truncate">
          <span className="text-white shrink-0">L</span>
          <span className={cn(
            "text-white transition-all duration-300 overflow-hidden whitespace-nowrap",
            isHovering ? "max-w-[100px] opacity-100" : "max-w-0 opacity-0"
          )}>umina</span>
          <span className="text-lumina-highlight">AI</span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden ml-auto text-gray-400 hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="p-4 space-y-1 flex-1 overflow-y-auto hide-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              suppressHydrationWarning
              onClick={onClose}
              aria-label={item.name}
              className={cn(
                "flex items-center py-3 text-sm font-semibold rounded-xl transition-all duration-300 relative group min-w-0",
                isHovering ? "px-4" : "justify-center px-0",
                isActive
                  ? "bg-lumina-highlight/15 text-lumina-highlight border border-lumina-highlight/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  : "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-all duration-300 shrink-0",
                  isHovering ? "mr-3" : "mr-0",
                  isActive ? "text-lumina-highlight" : "text-gray-500 group-hover:text-gray-300",
                )}
              />
              <span className={cn(
                "transition-all duration-300 overflow-hidden whitespace-nowrap truncate",
                isHovering ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom ── */}
      <div className={cn(
        "p-4 border-t border-white/10 space-y-3 shrink-0 transition-all duration-300",
        !isHovering && "px-3"
      )}>
        <Link
          href="/hod/alerts"
          className={cn(
            "flex items-center py-3 text-sm font-semibold rounded-xl transition-all duration-300 relative group min-w-0",
            isHovering ? "px-4" : "justify-center px-0",
            "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200",
          )}
        >
          <div className="relative shrink-0">
            <Bell className={cn(
              "h-5 w-5 transition-all duration-300",
              isHovering ? "mr-3" : "mr-0",
              "text-gray-500 group-hover:text-gray-300"
            )} />
            {notificationCount > 0 && (
              <span className={cn(
                "absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center",
                !isHovering && "right-[-4px]"
              )}>
                {notificationCount}
              </span>
            )}
          </div>
          <span className={cn(
            "transition-all duration-300 overflow-hidden whitespace-nowrap truncate",
            isHovering ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0"
          )}>
            Notifications
          </span>
        </Link>

        {user && (
          <Link
            href="/hod/dashboard"
            className={cn(
              "flex items-center rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden",
              isHovering ? "p-3 gap-3" : "p-2 justify-center"
            )}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name ?? "H")}&background=random`}
                alt="User avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className={cn(
              "transition-all duration-300 overflow-hidden min-w-0",
              isHovering ? "max-w-[150px] opacity-100" : "max-w-0 opacity-0"
            )}>
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
          </Link>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center w-full py-2 text-xs font-bold text-red-400/80 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-300",
            isHovering ? "px-4" : "justify-center px-0"
          )}
        >
          <LogOut className={cn(
            "h-4 w-4 transition-all duration-300 shrink-0",
            isHovering ? "mr-3" : "mr-0"
          )} />
          <span className={cn(
            "transition-all duration-300 overflow-hidden whitespace-nowrap",
            isHovering ? "max-w-[100px] opacity-100" : "max-w-0 opacity-0"
          )}>
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
