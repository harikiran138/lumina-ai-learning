"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  BarChart2,
  User,
  Settings,
  LogOut,
  Bot,
  FileText,
  X,
  Brain,
  Users,
  Calendar,
  CheckCircle,
  Bell,
  Search,
  Target,
  Award,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { getRoleHome } from "@/lib/role-routing";
import { useAuthStore } from "@/store/useAuthStore";
import { IS_PROTOTYPE } from "@/lib/config";

const roleNavItems: Record<string, any[]> = {
  student: [
    { name: "Dashboard",  href: "/student/dashboard",  icon: LayoutDashboard },
    { name: "Enrollment", href: "/student/enrollment",  icon: CheckCircle, isPrototype: true },
    { name: "Attendance", href: "/student/attendance",  icon: Calendar, isPrototype: true },
    { name: "My Courses", href: "/student/courses",     icon: BookOpen, isPrototype: true },
    { name: "Assignments",href: "/student/assignments", icon: FileText, isPrototype: true },
    { name: "Results",    href: "/student/grades",      icon: BarChart2, isPrototype: true },
    { name: "AI Tutor",   href: "/student/ai_tutor",    icon: Bot },
    { name: "Assessment", href: "/student/assessment",  icon: Brain, isPrototype: true },
    { name: "Progress",   href: "/student/progress",    icon: BarChart2, isPrototype: true },
    { name: "Community",  href: "/student/community",   icon: MessageSquare, isPrototype: true },
    { name: "Profile",    href: "/student/profile",     icon: User },
    { name: "Settings",   href: "/student/settings",    icon: Settings },
  ],
  parent: [
    { name: "Dashboard", href: "/parent/dashboard", icon: LayoutDashboard },
    { name: "Settings",  href: "/parent/settings",  icon: Settings },
  ],
  mentor: [
    { name: "Dashboard", href: "/mentor/dashboard", icon: LayoutDashboard },
    { name: "Settings",  href: "/mentor/settings",  icon: Settings },
  ],
  peer_tutor: [
    { name: "Dashboard", href: "/peer_tutor/dashboard", icon: LayoutDashboard },
    { name: "Settings",  href: "/peer_tutor/settings",  icon: Settings },
  ],
  counselor: [
    { name: "Dashboard",   href: "/counselor/dashboard", icon: LayoutDashboard },
  ],
  content_creator: [
    { name: "Dashboard", href: "/content_creator/dashboard", icon: LayoutDashboard },
    { name: "Designer Dashboard", href: "/designer", icon: BookOpen },
  ],
  researcher: [
    { name: "Dashboard", href: "/researcher/dashboard", icon: LayoutDashboard },
  ],
  alumni: [
    { name: "Dashboard",  href: "/alumni/dashboard",   icon: LayoutDashboard },
  ],
  teacher: [
    { name: "Dashboard",    href: "/faculty/dashboard",    icon: LayoutDashboard },
    { name: "Courses",      href: "/faculty/courses",      icon: BookOpen, isPrototype: true },
    { name: "Students",     href: "/faculty/students",     icon: Users },
    { name: "Verification", href: "/faculty/verification", icon: CheckCircle, isPrototype: true },
    { name: "Settings",     href: "/faculty/settings",     icon: Settings },
  ],
  admin: [
    { name: "Dashboard",   href: "/admin/dashboard",    icon: LayoutDashboard },
    { name: "Users",       href: "/admin/users",        icon: Users },
    { name: "Institutions",href: "/admin/institutions", icon: BookOpen },
    /* HIDDEN MOCK UI:
    { name: "Analytics",   href: "/admin/analytics",   icon: BarChart2 },
    */
    { name: "Settings",    href: "/admin/settings",    icon: Settings },
  ],
};

const profileHrefByRole: Record<string, string> = {
  student:         "/student/profile",
  teacher:         "/faculty/settings",
  admin:           "/admin/platform/profile",
  parent:          "/parent/settings",
  mentor:          "/mentor/settings",
  peer_tutor:      "/peer_tutor/settings",
  counselor:       "/counselor/notes",
  alumni:          "/alumni/portfolio",
  researcher:      "/researcher/dashboard",
  content_creator: "/content_creator/dashboard",
  creator:         "/content_creator/dashboard",
};

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed = true,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname  = usePathname();
  const router    = useRouter();

  // Auth store as primary cache — avoids repeat API calls on every page navigation
  const { user: storeUser, setUser: setStoreUser, clearAuth } = useAuthStore();
  const [user, setUser] = useState<any>(storeUser ?? null);

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

  const currentRole = (user?.role as string) || "student";
  const navItems = useMemo(() => {
    const rawItems = roleNavItems[currentRole] ?? roleNavItems.student;
    return rawItems.filter(item => !item.isPrototype || IS_PROTOTYPE);
  }, [currentRole]);
  const profileHref = profileHrefByRole[currentRole] ?? getRoleHome(currentRole);

  return (
    <aside
      data-collapsed={isCollapsed ? "true" : "false"}
      className={cn(
        /* lumina-sidebar drives all the CSS-only hover expand logic */
        "lumina-sidebar",
        "fixed left-4 top-4 bottom-4 glass-v2-gold border-white/5 shadow-premium z-50 flex flex-col",
        /* Mobile: slide in/out */
        isOpen
          ? "translate-x-0 bg-black/95"
          : "-translate-x-[120%] lg:translate-x-0 hidden lg:flex",
      )}
    >
      {/* ── Logo header ── */}
      <div className="sidebar-header flex items-center border-b border-white/5 shrink-0">
        <Link
          href="/"
          className="font-display font-black text-2xl flex items-center gap-1 select-none"
        >
          <span className="sidebar-logo-icon text-white">L</span>
          <span className="sidebar-logo-full text-white">Lumina</span>
          <span className="text-lumina-highlight">AI</span>
        </Link>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="lg:hidden ml-auto text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* ── Nav items ── */}
      <nav className="p-4 space-y-1 flex-1 overflow-y-auto hide-scrollbar">
        {navItems.map((item: any) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              suppressHydrationWarning
              onClick={onClose}
              aria-label={item.name}
              className={cn(
                "sidebar-nav-item py-3 text-sm font-semibold rounded-xl relative group w-full",
                isActive
                  ? "bg-lumina-highlight/15 text-lumina-highlight border border-lumina-highlight/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  : "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200",
              )}
            >
              <item.icon
                aria-hidden="true"
                className={cn(
                  "sidebar-icon h-5 w-5",
                  isActive
                    ? "text-lumina-highlight"
                    : "text-gray-500 group-hover:text-gray-300",
                )}
              />
              <span className="sidebar-text truncate">{item.name}</span>

              {/* Tooltip — CSS shows this only when collapsed + item is hovered */}
              <span className="sidebar-tooltip">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom: user + logout ── */}
      <div className="sidebar-bottom border-t border-white/10 space-y-3 shrink-0">
        {user && (
          <Link
            href={profileHref}
            className="sidebar-user-card flex items-center gap-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer overflow-hidden"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
              <img
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name ?? "U")}&background=random`
                }
                alt="User avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="sidebar-text min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
          </Link>
        )}

        <button
          onClick={handleLogout}
          suppressHydrationWarning
          aria-label="Sign out"
          className="sidebar-bottom-item flex items-center w-full py-2 text-xs font-bold text-red-400/80 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut aria-hidden="true" className="sidebar-icon h-4 w-4" />
          <span className="sidebar-text">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
