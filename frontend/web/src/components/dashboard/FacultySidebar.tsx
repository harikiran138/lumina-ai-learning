"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  Settings,
  LogOut,
  Sparkles,
  X,
  PlusCircle,
  BarChart3,
  Calendar,
  GraduationCap,
  ClipboardCheck,
  CheckCircle,
  Bell,
  ShieldCheck,
  GitBranch,
  Radio,
  MessageSquare,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

const navItems = [
  { name: "Dashboard",           href: "/faculty/dashboard",             icon: LayoutDashboard },
  { name: "AI Verify Queue",     href: "/faculty/verification-queue",    icon: ShieldCheck },
  { name: "My Courses",          href: "/faculty/courses",               icon: BookOpen },
  { name: "Students",            href: "/faculty/students",              icon: Users },
  { name: "Assignments",         href: "/faculty/assignments",           icon: ClipboardCheck },
  { name: "Create Assignment",   href: "/faculty/assignments/create",    icon: PlusCircle },
  { name: "Grading",             href: "/faculty/grading",               icon: FileText },
  { name: "Gradebook",           href: "/faculty/gradebook",             icon: GraduationCap },
  { name: "Calendar",            href: "/faculty/calendar",              icon: Calendar },
  { name: "Attendance",          href: "/faculty/attendance",            icon: CheckCircle },
  { name: "Question Bank",       href: "/faculty/question-bank",         icon: Database },
  { name: "Knowledge Graph",     href: "/faculty/knowledge-graph",       icon: GitBranch },
  { name: "Live Class",          href: "/faculty/live-class",            icon: Radio },
  { name: "Analytics",           href: "/faculty/analytics",             icon: BarChart3 },
  { name: "AI Course Creator",   href: "/faculty/ai-generator",          icon: Sparkles },
  { name: "Messages",            href: "/faculty/messages",              icon: MessageSquare },
  { name: "Settings",            href: "/faculty/settings",              icon: Settings },
];

const courseDependentItems = new Set([
  "Analytics", "My Courses", "Students", "Gradebook",
  "Assignments", "Create Assignment", "Grading", "AI Verify Queue",
  "Question Bank", "Knowledge Graph", "Live Class",
  "AI Course Creator", "Messages", "Calendar",
]);

export default function FacultySidebar({
  isOpen,
  onClose,
  // onHoverChange kept for backward compat but no longer triggers layout re-renders
  onHoverChange: _onHoverChange,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  onHoverChange?: (hovered: boolean) => void;
}) {
  const pathname = usePathname();
  const router   = useRouter();
  void _onHoverChange;

  const { user: storeUser, setUser: setStoreUser, clearAuth } = useAuthStore();
  const [user, setUser] = useState<any>(storeUser ?? null);
  const [hasAssignedCourses, setHasAssignedCourses] = useState<boolean | null>(null);
  const notificationCount = 3;

  useEffect(() => {
    if (storeUser) { setUser(storeUser); return; }
    api.getCurrentUser().then((data) => {
      if (data) { setUser(data); setStoreUser(data as any); }
    });
  }, [storeUser, setStoreUser]);

  useEffect(() => {
    api.listCourses()
      .then((courses) => setHasAssignedCourses(Array.isArray(courses) && courses.length > 0))
      .catch(() => setHasAssignedCourses(false));
  }, []);

  const handleLogout = useCallback(async () => {
    await api.logout();
    clearAuth();
    router.push("/login");
  }, [clearAuth, router]);

  const filteredNavItems =
    hasAssignedCourses === false
      ? navItems.filter((item) => !courseDependentItems.has(item.name))
      : navItems;

  return (
    <aside
      data-collapsed="true"
      className={cn(
        "lumina-sidebar",
        "fixed left-4 top-4 bottom-4 glass-v2-gold border-white/5 shadow-premium z-50 flex flex-col",
        isOpen
          ? "translate-x-0 bg-black/95"
          : "-translate-x-[120%] lg:translate-x-0 hidden lg:flex",
      )}
    >
      {/* ── Logo header ── */}
      <div className="sidebar-header flex items-center border-b border-white/5 shrink-0">
        <Link href="/" className="font-display font-black text-2xl flex items-center gap-1 select-none">
          <span className="sidebar-logo-icon text-white">L</span>
          <span className="sidebar-logo-full text-white">Lumina</span>
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
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
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
                  isActive ? "text-lumina-highlight" : "text-gray-500 group-hover:text-gray-300",
                )}
              />
              <span className="sidebar-text truncate">{item.name}</span>
              <span className="sidebar-tooltip">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom section ── */}
      <div className="sidebar-bottom border-t border-white/10 space-y-3 shrink-0">
        {/* Notifications */}
        <Link
          href="/faculty/alerts"
          aria-label="Notifications"
          className="sidebar-bottom-item sidebar-nav-item flex items-center w-full py-3 text-sm font-semibold rounded-xl text-gray-400 hover:bg-white/[0.03] hover:text-gray-200 relative group"
        >
          <div className="sidebar-icon relative h-5 w-5">
            <Bell className="h-5 w-5 text-gray-500 group-hover:text-gray-300" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </div>
          <span className="sidebar-text truncate">Notifications</span>
          <span className="sidebar-tooltip">Notifications</span>
        </Link>

        {/* User profile */}
        {user && (
          <Link
            href="/faculty/profile"
            className="sidebar-user-card flex items-center gap-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer overflow-hidden"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name ?? "F")}&background=random`}
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
