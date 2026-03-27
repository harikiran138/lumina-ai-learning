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
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const navItems = [
  { name: "Dashboard", href: "/faculty/dashboard", icon: LayoutDashboard },
  { name: "My Courses", href: "/faculty/courses", icon: BookOpen },
  { name: "Students", href: "/faculty/students", icon: Users },
  { name: "Assignments", href: "/faculty/assignments", icon: ClipboardCheck },
  { name: "Attendance", href: "/faculty/attendance", icon: CheckCircle },
  {
    name: "Create Assignment",
    href: "/faculty/assignments/create",
    icon: PlusCircle,
  },
  { name: "Gradebook", href: "/faculty/gradebook", icon: GraduationCap },
  { name: "Grading", href: "/faculty/grading", icon: FileText },
  { name: "Calendar", href: "/faculty/calendar", icon: Calendar },
  { name: "Analytics", href: "/faculty/analytics", icon: BarChart3 },
  { name: "AI Course Creator", href: "/faculty/ai-generator", icon: Sparkles },
  { name: "Resources", href: "/faculty/resources", icon: FileText },
  { name: "Settings", href: "/faculty/settings", icon: Settings },
];

export default function FacultySidebar({
  isOpen,
  onClose,
  onHoverChange,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  onHoverChange?: (hovered: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isHovered, setIsHovered] = useState(false);
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
    const fetchFacultyCourses = async () => {
      try {
        const courses = await api.listCourses(); 
        setHasAssignedCourses(Array.isArray(courses) && courses.length > 0);
      } catch {
        setHasAssignedCourses(false);
      }
    };
    fetchFacultyCourses();
  }, []);

  const handleLogout = async () => {
    await api.logout();
    router.push("/login");
  };

  const courseDependentItems = new Set([
    "Analytics",
    "My Courses",
    "Students",
    "Gradebook",
    "Assignments",
    "Create Assignment",
    "Grading",
    "AI Course Creator",
    "Resources",
  ]);

  const filteredNavItems =
    hasAssignedCourses === false
      ? navItems.filter((item) => !courseDependentItems.has(item.name))
      : navItems;

  return (
    <aside
      onMouseEnter={() => {
        setIsHovered(true);
        onHoverChange?.(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHoverChange?.(false);
      }}
      className={cn(
        "peer fixed left-4 top-4 bottom-4 glass-v2 border-white/5 shadow-premium z-50 transition-all duration-500 ease-in-out lg:translate-x-0 lg:flex flex-col overflow-hidden",
        !isHovered ? "lg:w-20" : "lg:w-64",
        isOpen
          ? "translate-x-0 bg-black/95 w-64 flex"
          : "-translate-x-[120%] lg:translate-x-0 hidden lg:flex",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b border-white/5 shrink-0 transition-all duration-500",
          !isHovered ? "h-16 px-4 justify-center" : "h-20 px-6",
        )}
      >
        <Link href="/" className="text-2xl font-display font-bold flex items-center gap-2">
          <span className="gradient-text">{!isHovered ? "L" : "Lumina"}</span>
          <span
            className={cn(
              "transition-all duration-500",
              !isHovered
                ? "opacity-0 w-0 overflow-hidden"
                : "opacity-100 w-auto",
            )}
          >
            ✨
          </span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-white transition-colors"
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
                !isHovered ? "justify-center px-0" : "px-4",
                isActive
                  ? "bg-lumina-primary/10 text-lumina-primary border border-lumina-primary/20 shadow-gold-glow"
                  : "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-all duration-500 shrink-0",
                  !isHovered ? "mr-0 scale-110" : "mr-3",
                  isActive
                    ? "text-lumina-primary"
                    : "text-gray-500 group-hover:text-gray-300",
                )}
              />
              <span
                className={cn(
                  "transition-all duration-500 whitespace-nowrap overflow-hidden truncate min-w-0",
                  !isHovered ? "opacity-0 w-0" : "opacity-100 w-auto",
                )}
              >
                {item.name}
              </span>

              {!isHovered && (
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-surface-950 border border-white/10 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-1 group-hover:translate-x-0 z-[60] shadow-premium">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "p-4 border-t border-white/10 space-y-4 transition-all duration-500 shrink-0",
          !isHovered && "px-3",
        )}
      >
        <Link
          href="/faculty/notifications"
          className={cn(
            "flex items-center py-3 text-sm font-semibold rounded-xl transition-all duration-300 relative group min-w-0",
            !isHovered ? "justify-center px-0" : "px-4",
            "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200",
          )}
        >
          <div className="relative">
            <Bell
              className={cn(
                "h-5 w-5 transition-all duration-500 shrink-0",
                !isHovered ? "mr-0 scale-110" : "mr-3",
                "text-gray-500 group-hover:text-gray-300",
              )}
            />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </div>
          <span
            className={cn(
              "transition-all duration-500 whitespace-nowrap overflow-hidden",
              !isHovered ? "opacity-0 w-0" : "opacity-100 w-auto",
            )}
          >
            Notifications
          </span>
        </Link>

        {user && (
          <Link
            href="/faculty/settings"
            className={cn(
              "flex items-center gap-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-500 cursor-pointer overflow-hidden",
              !isHovered ? "justify-center p-2" : "p-3",
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
                "min-w-0 transition-all duration-500",
                !isHovered ? "opacity-0 w-0" : "opacity-100 w-auto",
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
          suppressHydrationWarning
          className={cn(
            "flex items-center w-full py-2 text-xs font-bold text-red-400/80 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-300",
            !isHovered ? "justify-center px-0" : "px-4",
          )}
        >
          <LogOut
            className={cn(
              "h-4 w-4 transition-all duration-500",
              !isHovered ? "mr-0" : "mr-3",
            )}
          />
          <span
            className={cn(
              "transition-all duration-500",
              !isHovered ? "opacity-0 w-0" : "opacity-100 w-auto",
            )}
          >
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
