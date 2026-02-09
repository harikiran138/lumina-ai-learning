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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const navItems = [
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Assignments", href: "/student/assignments", icon: FileText },
  { name: "AI Tutor", href: "/student/ai_tutor", icon: Bot },
  { name: "Assessment", href: "/student/assessment", icon: Brain },
  { name: "My Courses", href: "/student/courses", icon: BookOpen },
  { name: "My Notes", href: "/student/my_notes", icon: FileText },
  { name: "Community", href: "/student/community", icon: MessageSquare },
  { name: "Progress", href: "/student/progress", icon: BarChart2 },
  { name: "Profile", href: "/student/profile", icon: User },
  { name: "Settings", href: "/student/settings", icon: Settings },
];

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
          className="text-2xl font-display font-bold flex items-center gap-2"
        >
          <span className="gradient-text">
            {isCollapsed && !isHovered ? "L" : "Lumina"}
          </span>
          <span
            className={cn(
              "transition-all duration-500",
              isCollapsed && !isHovered
                ? "opacity-0 w-0 overflow-hidden"
                : "opacity-100 w-auto",
            )}
          >
            ✨
          </span>
        </Link>
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto hide-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              suppressHydrationWarning
              onClick={onClose}
              className={cn(
                "flex items-center py-3 text-sm font-semibold rounded-xl transition-all duration-300 relative group",
                isCollapsed && !isHovered ? "justify-center px-0" : "px-4",
                isActive
                  ? "bg-lumina-primary/10 text-lumina-primary border border-lumina-primary/20 shadow-gold-glow"
                  : "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-all duration-500",
                  isCollapsed && !isHovered ? "mr-0 scale-110" : "mr-3",
                  isActive
                    ? "text-lumina-primary"
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
            href="/student/profile"
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
          className={cn(
            "flex items-center w-full py-2 text-xs font-bold text-red-400/80 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-300",
            isCollapsed && !isHovered ? "justify-center px-0" : "px-4",
          )}
        >
          <LogOut
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
