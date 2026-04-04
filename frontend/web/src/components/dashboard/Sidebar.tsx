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
TrendingUp,

// ✅ ALL MERGED ICONS
Star,
GraduationCap,
AlertTriangle,
ScrollText,
Award,
Trophy,
RefreshCw,
Network,
NotebookPen,
ClipboardList,
Activity,
Zap,
Lock,
Share2,
BarChart,

} from "lucide-react";

import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { getRoleHome } from "@/lib/role-routing";
import { useAuthStore } from "@/store/useAuthStore";

/* ================= ROLE NAV ================= */
const roleNavItems: Record<string, any[]> = {

student: [
{ name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
{ name: "Courses", href: "/student/courses", icon: BookOpen },
{ name: "Assignments", href: "/student/assignments", icon: FileText },
{ name: "AI Tutor", href: "/student/ai_tutor", icon: Bot },
{ name: "Knowledge Graph", href: "/student/progress/knowledge-graph", icon: Network },
{ name: "Revision", href: "/student/spaced_repetition", icon: RefreshCw },
{ name: "Exam Readiness", href: "/student/exam_readiness", icon: ClipboardList },
{ name: "Leaderboard", href: "/student/leaderboard", icon: Trophy },
{ name: "Notes", href: "/student/my_notes", icon: NotebookPen },
{ name: "Profile", href: "/student/profile", icon: User },
],

parent: [
{ name: "Dashboard", href: "/parent/dashboard", icon: LayoutDashboard },
{ name: "Progress", href: "/parent/progress", icon: TrendingUp },
{ name: "Assignments", href: "/parent/assignments", icon: ClipboardList },
{ name: "Alerts", href: "/parent/alerts", icon: AlertTriangle },
{ name: "Settings", href: "/parent/settings", icon: Settings },
],

peer_tutor: [
{ name: "Dashboard", href: "/peer_tutor/dashboard", icon: LayoutDashboard },
{ name: "Students", href: "/peer_tutor/students", icon: GraduationCap },
{ name: "Escalations", href: "/peer_tutor/escalations", icon: AlertTriangle },
{ name: "Feedback", href: "/peer_tutor/feedback", icon: Star },
{ name: "Certificate", href: "/peer_tutor/certificate", icon: ScrollText },
{ name: "Settings", href: "/peer_tutor/settings", icon: Settings },
],

counselor: [
{ name: "Dashboard", href: "/counselor/dashboard", icon: LayoutDashboard },
{ name: "At-Risk Students", href: "/counselor/at-risk", icon: AlertTriangle },
{ name: "Behavior Analytics", href: "/counselor/behavior-analytics", icon: Activity },
{ name: "Interventions", href: "/counselor/interventions", icon: Zap },
{ name: "Session Notes", href: "/counselor/notes", icon: Lock },
{ name: "Referrals", href: "/counselor/referrals", icon: Share2 },
{ name: "Reports", href: "/counselor/reports", icon: BarChart },
{ name: "Settings", href: "/counselor/settings", icon: Settings },
],

teacher: [
{ name: "Dashboard", href: "/faculty/dashboard", icon: LayoutDashboard },
{ name: "Students", href: "/faculty/students", icon: Users },
{ name: "Settings", href: "/faculty/settings", icon: Settings },
],

admin: [
{ name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
{ name: "Users", href: "/admin/users", icon: Users },
{ name: "Institutions", href: "/admin/institutions", icon: BookOpen },
{ name: "Settings", href: "/admin/settings", icon: Settings },
],
};

/* ================= PROFILE ================= */
const profileHrefByRole: Record<string, string> = {
student: "/student/profile",
parent: "/parent/settings",
peer_tutor: "/peer_tutor/settings",
counselor: "/counselor/settings",
teacher: "/faculty/settings",
admin: "/admin/platform/profile",
};

/* ================= COMPONENT ================= */
export default function Sidebar({
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

  const { user: storeUser, setUser, clearAuth } = useAuthStore();
  const [user, setLocalUser] = useState<any>(storeUser ?? null);
  const [localHover, setLocalHover] = useState(false);
  const isHovered = isHovering ?? localHover;

  useEffect(() => {
    if (storeUser) {
      setLocalUser(storeUser);
      return;
    }

    api.getCurrentUser().then((data) => {
      if (data) {
        setLocalUser(data);
        setUser(data as any);
      }
    });
  }, [storeUser, setUser]);

  const handleLogout = useCallback(async () => {
    await api.logout();
    clearAuth();
    router.push("/login");
  }, [clearAuth, router]);

  const currentRole = (user?.role as string) || "student";

  const navItems = useMemo(() => {
    return roleNavItems[currentRole] ?? roleNavItems.student;
  }, [currentRole]);

  const profileHref =
    profileHrefByRole[currentRole] ?? getRoleHome(currentRole);

  const handleHoverChange = (hovered: boolean) => {
    setLocalHover(hovered);
    onHoverChange?.(hovered);
  };

  return (
    <aside
      onMouseEnter={() => handleHoverChange(true)}
      onMouseLeave={() => handleHoverChange(false)}
      className={cn(
        "fixed left-4 top-4 bottom-4 glass-v2-gold border-white/5 shadow-premium z-50 flex flex-col transition-all duration-300 ease-in-out overflow-hidden rounded-2xl",
        isHovered ? "w-64" : "w-20",
        isOpen ? "translate-x-0 w-64 flex" : "-translate-x-full lg:translate-x-0 hidden lg:flex"
      )}
    >
      {/* LOGO */}
      <div className={cn("flex items-center border-b border-white/5 px-6 h-16 shrink-0")}>
        <Link href="/" className="text-2xl font-display font-black flex items-center gap-1 select-none">
          <span className="text-white shrink-0">L</span>
          <span className={cn(
            "text-white transition-all duration-300 overflow-hidden whitespace-nowrap",
            isHovered ? "opacity-100 max-w-[120px]" : "opacity-0 max-w-0"
          )}>
            umina
          </span>
          <span className={cn(
            "text-highlight-gold transition-all duration-300 overflow-hidden whitespace-nowrap",
            isHovered ? "opacity-100 max-w-[60px]" : "opacity-0 max-w-0"
          )}>
            AI
          </span>
        </Link>

        {onClose && (
          <button onClick={onClose} className="lg:hidden ml-auto text-gray-400 hover:text-white" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* NAV */}
      <nav className="p-4 flex-1 overflow-y-auto hide-scrollbar space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-highlight-gold/20 text-highlight-gold border border-highlight-gold/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  : "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200"
              )}
            >
              <item.icon className={cn("w-6 h-6 flex-shrink-0", isActive ? "text-highlight-gold" : "text-gray-500 group-hover:text-gray-300")} />
              <span className={cn(
                "font-semibold text-sm transition-all duration-300 overflow-hidden whitespace-nowrap",
                isHovered ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0"
              )}>
                {item.name}
              </span>
              {!isHovered && (
                <span className="absolute left-16 bg-black/90 border border-white/10 px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap shadow-xl">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* USER & LOGOUT */}
      <div className="border-t border-white/5 p-4 space-y-2">
        {user && (
          <Link
            href={profileHref}
            className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all overflow-hidden"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                alt="User avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className={cn(
              "transition-all duration-300 overflow-hidden whitespace-nowrap",
              isHovered ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0"
            )}>
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
          </Link>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-4 w-full py-3 px-3 rounded-xl text-xs font-bold text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors group relative",
            !isHovered && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className={cn(
            "transition-all duration-300 overflow-hidden whitespace-nowrap",
            isHovered ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0"
          )}>
            Sign Out
          </span>
          {!isHovered && (
            <span className="absolute left-16 bg-black/90 border border-white/10 px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap shadow-xl">
              Sign Out
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
