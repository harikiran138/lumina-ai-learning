"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  ChevronLeft,
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

const roleNavItems: Record<string, any[]> = {
  student: [
    { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { name: "Assignments", href: "/student/assignments", icon: FileText },
    { name: "AI Tutor", href: "/student/ai_tutor", icon: Bot },
    { name: "Assessment", href: "/student/assessment", icon: Brain },
    { name: "My Courses", href: "/student/courses", icon: BookOpen },
    { name: "Progress", href: "/student/progress", icon: BarChart2 },
    { name: "Community", href: "/student/community", icon: MessageSquare },
    { name: "Profile", href: "/student/profile", icon: User },
    { name: "Settings", href: "/student/settings", icon: Settings },
  ],
  parent: [
    { name: "Dashboard", href: "/parent/dashboard", icon: LayoutDashboard },
    { name: "Progress", href: "/parent/progress", icon: BarChart2 },
    { name: "Goals", href: "/parent/goals", icon: Target },
    { name: "Messages", href: "/parent/messages", icon: MessageSquare },
    { name: "Settings", href: "/parent/settings", icon: Settings },
  ],
  mentor: [
    { name: "Dashboard", href: "/mentor/dashboard", icon: LayoutDashboard },
    { name: "Matches", href: "/mentor/matches", icon: Users },
    { name: "Sessions", href: "/mentor/sessions", icon: Calendar },
    { name: "Reviews", href: "/mentor/reviews", icon: CheckCircle },
    { name: "Settings", href: "/mentor/settings", icon: Settings },
  ],
  peer_tutor: [
    { name: "Dashboard", href: "/peer-tutor/dashboard", icon: LayoutDashboard },
    { name: "Sessions", href: "/peer-tutor/sessions", icon: Clock },
    { name: "Training", href: "/peer-tutor/training", icon: Brain },
    { name: "Settings", href: "/peer-tutor/settings", icon: Settings },
  ],
  counselor: [
    { name: "Dashboard", href: "/counselor/dashboard", icon: LayoutDashboard },
    { name: "Students", href: "/counselor/students", icon: Users },
    { name: "Crisis Cases", href: "/counselor/crisis", icon: Bell },
    { name: "Notes", href: "/counselor/notes", icon: FileText },
    { name: "Settings", href: "/counselor/settings", icon: Settings },
  ],
  content_creator: [
    { name: "Dashboard", href: "/creator/dashboard", icon: LayoutDashboard },
    { name: "Blueprints", href: "/creator/blueprints", icon: FileText },
    { name: "Question Bank", href: "/creator/questions", icon: Brain },
    { name: "Settings", href: "/creator/settings", icon: Settings },
  ],
  researcher: [
    { name: "Dashboard", href: "/researcher/dashboard", icon: LayoutDashboard },
    { name: "Datasets", href: "/researcher/datasets", icon: BarChart2 },
    { name: "Queries", href: "/researcher/queries", icon: Search },
    { name: "Settings", href: "/researcher/settings", icon: Settings },
  ],
  alumni: [
    { name: "Dashboard", href: "/alumni/dashboard", icon: LayoutDashboard },
    { name: "Mentorship", href: "/alumni/mentorship", icon: Users },
    { name: "Portfolio", href: "/alumni/portfolio", icon: Award },
    { name: "Settings", href: "/alumni/settings", icon: Settings },
  ],
  teacher: [
    { name: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
    { name: "Courses", href: "/teacher/courses", icon: BookOpen },
    { name: "Students", href: "/teacher/students", icon: Users },
    { name: "Verification", href: "/teacher/verification", icon: CheckCircle },
    { name: "Settings", href: "/teacher/settings", icon: Settings },
  ],
  admin: [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Institutions", href: "/admin/institutions", icon: BookOpen },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart2 },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ],
};

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await api.getCurrentUser();
      setUser(userData);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await api.logout();
    router.push("/login");
  };

  const currentRole = user?.role || "student";
  const navItems = roleNavItems[currentRole] || roleNavItems["student"];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed left-4 top-4 bottom-4 glass-v2 border-white/5 shadow-premium z-50 transition-all duration-500 ease-in-out lg:translate-x-0 lg:flex flex-col overflow-hidden",
        isCollapsed && !isHovered ? "w-20" : "w-64",
        isOpen
          ? "translate-x-0 bg-black/95 w-64"
          : "-translate-x-[120%] lg:translate-x-0 hidden lg:flex",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b border-white/5 shrink-0 transition-all duration-500",
          isCollapsed && !isHovered ? "h-16 px-4 justify-center" : "h-20 px-6",
        )}
      >
        <Link
          href="/"
          className="text-2xl font-display font-black flex items-center gap-2"
        >
          <span className="text-white">
            {isCollapsed && !isHovered ? "L" : "Lumina"}
          </span>
          <span className="text-lumina-highlight">AI</span>
        </Link>
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="lg:hidden text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumina-primary rounded"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>

      <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto hide-scrollbar">
        {navItems.map((item: any) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              suppressHydrationWarning
              onClick={onClose}
              aria-label={isCollapsed && !isHovered ? item.name : undefined}
              className={cn(
                "flex items-center py-3 text-sm font-semibold rounded-xl transition-all duration-300 relative group",
                isCollapsed && !isHovered ? "justify-center px-0" : "px-4",
                isActive
                  ? "bg-lumina-highlight/10 text-lumina-highlight border border-lumina-highlight/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                  : "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200",
              )}
            >
              <item.icon
                aria-hidden="true"
                className={cn(
                  "h-5 w-5 transition-all duration-500",
                  isCollapsed && !isHovered ? "mr-0 scale-110" : "mr-3",
                  isActive
                    ? "text-lumina-highlight"
                    : "text-gray-500 group-hover:text-gray-300",
                )}
              />
              <span
                className={cn(
                  "transition-all duration-500 whitespace-nowrap overflow-hidden",
                  isCollapsed && !isHovered
                    ? "opacity-0 w-0"
                    : "opacity-100 w-auto",
                )}
              >
                {item.name}
              </span>

              {isCollapsed && !isHovered && (
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
          isCollapsed && !isHovered && "px-3",
        )}
      >
        {/* User Profile Snippet */}
        {user && (
          <Link
            href={`/${currentRole}/profile`}
            className={cn(
              "flex items-center gap-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-500 cursor-pointer overflow-hidden",
              isCollapsed && !isHovered ? "justify-center p-2" : "p-3",
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
                isCollapsed && !isHovered
                  ? "opacity-0 w-0"
                  : "opacity-100 w-auto",
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
          aria-label="Sign out"
          className={cn(
            "flex items-center w-full py-2 text-xs font-bold text-red-400/80 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400",
            isCollapsed && !isHovered ? "justify-center px-0" : "px-4",
          )}
        >
          <LogOut
            aria-hidden="true"
            className={cn(
              "h-4 w-4 transition-all duration-500",
              isCollapsed && !isHovered ? "mr-0" : "mr-3",
            )}
          />
          <span
            className={cn(
              "transition-all duration-500",
              isCollapsed && !isHovered
                ? "opacity-0 w-0"
                : "opacity-100 w-auto",
            )}
          >
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
