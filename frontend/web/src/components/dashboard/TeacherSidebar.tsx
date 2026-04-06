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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const navItems = [
  { name: "Dashboard",          href: "/teacher/dashboard",            icon: LayoutDashboard },
  { name: "AI Verify Queue",    href: "/teacher/verification-queue",   icon: ShieldCheck },
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
  { name: "Messages",           href: "/teacher/messages",             icon: MessageSquare },
  { name: "Settings",           href: "/teacher/settings",             icon: Settings },
];

export default function TeacherSidebar({
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
  const [notificationCount, setNotificationCount] = useState(3);
  const [hasAssignedCourses, setHasAssignedCourses] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await api.getCurrentUser();
      setUser(userData);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchTeacherCourses = async () => {
      try {
        const courses = await api.getTeacherCourses();
        setHasAssignedCourses(Array.isArray(courses) && courses.length > 0);
      } catch {
        setHasAssignedCourses(false);
      }
    };
    fetchTeacherCourses();
  }, []);

  const handleLogout = async () => {
    await api.logout();
    router.push("/login");
  };

  const courseDependentItems = new Set([
    "Analytics", "Students", "Gradebook",
    "Assignments", "Create Assignment", "Grading", "AI Verify Queue",
    "Question Bank", "Knowledge Graph", "Live Class",
    "Messages", "Calendar",
  ]);

  const filteredNavItems = navItems;

  return (
    <aside
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className={cn(
        "fixed left-4 top-4 bottom-4 glass-v2-gold border-white/5 shadow-premium z-50 transition-all duration-300 ease-in-out flex flex-col overflow-hidden",
        isHovering ? "w-64" : "w-20",
        isOpen
          ? "translate-x-0 bg-black/95 w-64 flex"
          : "-translate-x-[120%] lg:translate-x-0 hidden lg:flex",
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-white/5 shrink-0 transition-all duration-300",
          isHovering ? "h-20 px-6" : "h-16 px-4 justify-center",
        )}
      >
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
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto hide-scrollbar">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              suppressHydrationWarning
              onClick={onClose}
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
                  isActive
                    ? "text-lumina-highlight"
                    : "text-gray-500 group-hover:text-gray-300",
                )}
              />
              <span
                className={cn(
                  "transition-all duration-300 whitespace-nowrap overflow-hidden truncate",
                  isHovering ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0",
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "p-4 border-t border-white/10 space-y-4 transition-all duration-300 shrink-0",
          !isHovering && "px-3",
        )}
      >
        <Link
          href="/teacher/alerts"
          className={cn(
            "flex items-center py-3 text-sm font-semibold rounded-xl transition-all duration-300 relative group min-w-0",
            isHovering ? "px-4" : "justify-center px-0",
            "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200",
          )}
        >
          <div className="relative shrink-0">
            <Bell
              className={cn(
                "h-5 w-5 transition-all duration-300 shrink-0",
                isHovering ? "mr-3" : "mr-0",
                "text-gray-500 group-hover:text-gray-300",
              )}
            />
            {notificationCount > 0 && (
              <span className={cn(
                "absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center",
                !isHovering && "right-[-4px]"
              )}>
                {notificationCount}
              </span>
            )}
          </div>
          <span
            className={cn(
              "transition-all duration-300 whitespace-nowrap overflow-hidden truncate",
              isHovering ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0",
            )}
          >
            Notifications
          </span>
        </Link>

        {user && (
          <Link
            href="/teacher/profile"
            className={cn(
              "flex items-center rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden",
              isHovering ? "p-3 gap-3" : "p-2 justify-center",
            )}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
              <img
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${user.name}&background=random`
                }
                alt="User"
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className={cn(
                "min-w-0 transition-all duration-300",
                isHovering ? "max-w-[150px] opacity-100" : "max-w-0 opacity-0",
              )}
            >
              <p className="text-xs font-bold text-white truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-gray-400 truncate tracking-tight">
                {user.email}
              </p>
            </div>
          </Link>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center w-full py-2 text-xs font-bold text-red-400/80 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-300",
            isHovering ? "px-4" : "justify-center px-0",
          )}
        >
          <LogOut
            className={cn(
              "h-4 w-4 transition-all duration-300 shrink-0",
              isHovering ? "mr-3" : "mr-0",
            )}
          />
          <span
            className={cn(
              "transition-all duration-300 whitespace-nowrap overflow-hidden",
              isHovering ? "max-w-[100px] opacity-100" : "max-w-0 opacity-0",
            )}
          >
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
