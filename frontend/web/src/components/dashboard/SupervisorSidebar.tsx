"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  MessageSquare,
  Bell,
  ShieldCheck,
  GitBranch,
  Radio,
  Database,
  BookMarked,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// All teacher nav items that supervisor inherits
const TEACHER_NAV_ITEMS = [
  { name: "Dashboard",          href: "/teacher/dashboard",            icon: LayoutDashboard },
  { name: "AI Queue",           href: "/teacher/verification-queue",   icon: ShieldCheck },
  { name: "My Courses",         href: "/teacher/courses",              icon: BookOpen },
  { name: "Students",           href: "/teacher/students",             icon: Users },
  { name: "Assignments",        href: "/teacher/assignments",          icon: ClipboardCheck },
  { name: "Create Assignment",  href: "/teacher/assignments/create",   icon: PlusCircle },
  { name: "Grading",            href: "/teacher/grading",              icon: FileText },
  { name: "Gradebook",          href: "/teacher/gradebook",            icon: GraduationCap },
  { name: "Calendar",           href: "/teacher/calendar",             icon: Calendar },
  { name: "Attendance",         href: "/teacher/attendance",           icon: CheckCircle },
  { name: "Question Bank",      href: "/teacher/question-bank",        icon: Database },
  { name: "Knowledge Graph",    href: "/teacher/knowledge-graph",      icon: GitBranch },
  { name: "Live Class",         href: "/teacher/live-class",           icon: Radio },
  { name: "Analytics",          href: "/teacher/analytics",            icon: BarChart3 },
  { name: "AI Course Creator",  href: "/teacher/ai-generator",         icon: Sparkles },
  { name: "Video Analysis",     href: "/teacher/video-analysis",       icon: Cpu },
  { name: "Messages",           href: "/teacher/messages",             icon: MessageSquare },
];

// Supervisor-specific extra items (appended after teacher items)
const SUPERVISOR_EXTRA_ITEMS = [
  { name: "Faculty Coordination", href: "/teacher/coordination",        icon: Users },
  { name: "Coordinator Courses",  href: "/teacher/courses/coordinator", icon: BookMarked },
];

const navItems = [...TEACHER_NAV_ITEMS, ...SUPERVISOR_EXTRA_ITEMS];

export default function SupervisorSidebar({
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
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);

  useEffect(() => {
    api.getCurrentUser().then(setUser).catch(() => {});
  }, []);

  // Poll AI queue pending count every 60s
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/teacher/ai-queue/count?status=PENDING");
        if (res.ok) {
          const data = await res.json();
          setPendingQueueCount(data.count ?? 0);
        }
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await api.logout();
    router.push("/login");
  };

  const expanded = isHovering || isOpen;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-50 flex flex-col bg-surface-950 border-r border-white/5",
          "transition-all duration-300 ease-in-out overflow-hidden",
          expanded ? "w-64" : "w-20",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        onMouseEnter={() => onHoverChange?.(true)}
        onMouseLeave={() => onHoverChange?.(false)}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/5">
          <div className={cn("flex items-center gap-3 overflow-hidden", !expanded && "justify-center w-full")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
              SV
            </div>
            {expanded && (
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name ?? "Supervisor"}
                </p>
                <p className="text-[10px] text-teal-400 font-medium">Supervisor</p>
              </div>
            )}
          </div>
          {isOpen && (
            <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
          {/* Supervisor badge */}
          {expanded && (
            <div className="mx-2 mb-3 px-2 py-1 rounded bg-teal-500/10 border border-teal-500/20">
              <p className="text-[10px] text-teal-400 font-medium text-center tracking-wider uppercase">
                Supervisor Portal
              </p>
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isQueueItem = item.href === "/teacher/verification-queue";
            const isSupervisorExtra = SUPERVISOR_EXTRA_ITEMS.some(e => e.href === item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={!expanded ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative",
                  isActive
                    ? "bg-teal-500/15 text-teal-400"
                    : isSupervisorExtra
                    ? "text-teal-300/70 hover:text-teal-300 hover:bg-teal-500/10"
                    : "text-muted-foreground hover:text-white hover:bg-white/5",
                  !expanded && "justify-center"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {expanded && <span className="truncate">{item.name}</span>}
                {isQueueItem && pendingQueueCount > 0 && (
                  <span className={cn(
                    "flex items-center justify-center rounded-full bg-red-500 text-white font-bold leading-none",
                    expanded ? "ml-auto text-[10px] min-w-[18px] h-[18px] px-1" : "absolute top-1 right-1 text-[8px] w-3.5 h-3.5"
                  )}>
                    {pendingQueueCount > 99 ? "99+" : pendingQueueCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/5 p-3 space-y-1">
          <Link
            href="/teacher/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors",
              !expanded && "justify-center"
            )}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {expanded && <span>Settings</span>}
          </Link>
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors",
              !expanded && "justify-center"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {expanded && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
