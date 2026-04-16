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
{ name: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
{ name: "Students", href: "/teacher/students", icon: Users },
{ name: "Settings", href: "/teacher/settings", icon: Settings },
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
teacher: "/teacher/settings",
admin: "/admin/platform/profile",
};

/* ================= COMPONENT ================= */
export default function Sidebar({
  isOpen,
  onClose,
  isHovering,
  onHoverChange,
  variant = "default",
}: {
  isOpen?: boolean;
  onClose?: () => void;
  isHovering?: boolean;
  onHoverChange?: (hovered: boolean) => void;
  variant?: "default" | "premium";
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isPremium = variant === "premium";

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
        "fixed left-0 top-0 bottom-0 z-40 flex flex-col transition-all duration-300 ease-in-out overflow-hidden shadow-2xl",
        isPremium 
          ? "bg-[#fdfaf5]/60 backdrop-blur-2xl border-r border-[#efe9de]" 
          : "bg-background/92 backdrop-blur-2xl border-r border-border shadow-[20px_0_40px_-20px_rgba(17,24,39,0.18)] dark:shadow-[20px_0_40px_-20px_rgba(0,0,0,0.8)]",
        isHovered ? "w-64" : "w-20",
        isOpen ? "translate-x-0 w-64 flex" : "-translate-x-full lg:translate-x-0 hidden lg:flex"
      )}
    >
      {/* LOGO */}
      <div className={cn(
        "flex items-center px-6 h-16 shrink-0",
        isPremium ? "border-b border-[#efe9de]" : "border-b border-border bg-gradient-to-b from-primary/6 to-transparent"
      )}>
        <Link href="/" className="text-2xl font-display font-black flex items-center gap-1 select-none">
          <span className={cn(
            "shrink-0",
            isPremium ? "text-[#4a3f35]" : "text-foreground"
          )}>L</span>
          <span className={cn(
            "transition-all duration-300 overflow-hidden whitespace-nowrap",
            isPremium ? "text-[#4a3f35]" : "text-foreground",
            isHovered ? "opacity-100 max-w-[120px]" : "opacity-0 max-w-0"
          )}>
            umina
          </span>
          <span className={cn(
            "text-lumina-highlight transition-all duration-300 overflow-hidden whitespace-nowrap",
            isHovered ? "opacity-100 max-w-[60px]" : "opacity-0 max-w-0"
          )}>
            AI
          </span>
        </Link>


        {onClose && (
          <button onClick={onClose} className={cn("lg:hidden ml-auto hover:text-foreground", isPremium ? "text-[#8c7851]" : "text-muted-foreground")} aria-label="Close menu">
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
                "flex items-center p-3 rounded-xl transition-all duration-300 group relative min-w-0",
                isHovered ? "gap-3 px-4" : "justify-center px-0",
                isActive
                  ? isPremium 
                    ? "bg-[#8c7851]/10 text-[#8c7851] border border-[#8c7851]/30 shadow-[0_0_20px_rgba(140,120,81,0.1)]"
                    : "bg-primary/12 text-primary border border-primary/25 shadow-[0_0_30px_rgba(34,197,94,0.14)] dark:shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                  : isPremium 
                    ? "text-[#807060] hover:bg-[#8c7851]/5 hover:text-[#4a3f35]"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 shrink-0 transition-all duration-300", 
                isActive 
                  ? (isPremium ? "text-[#8c7851]" : "text-primary drop-shadow-[0_0_8px_rgba(34,197,94,0.35)] dark:drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]") 
                  : (isPremium ? "text-[#b8a994] group-hover:text-[#8c7851]" : "text-muted-foreground group-hover:text-primary")
              )} />

              <span className={cn(
                "font-semibold text-sm transition-all duration-300 overflow-hidden whitespace-nowrap truncate",
                isHovered ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* USER & LOGOUT */}
      <div className={cn(
        "p-4 space-y-2 shrink-0",
        isPremium ? "border-t border-[#efe9de]" : "border-t border-border"
      )}>
        {user && (
          <Link
            href={profileHref}
            className={cn(
              "flex items-center rounded-xl transition-all duration-300 overflow-hidden border",
              isPremium 
                ? "bg-white/50 border-[#efe9de] hover:bg-white/80" 
                : "bg-card/85 border-border hover:bg-secondary",
              isHovered ? "p-3 gap-3" : "p-2 justify-center"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full overflow-hidden border shrink-0",
              isPremium ? "border-[#efe9de]" : "border-border"
            )}>
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
              <p className={cn(
                "text-xs font-bold truncate",
                isPremium ? "text-[#4a3f35]" : "text-foreground"
              )}>{user.name}</p>
              <p className={cn(
                "text-[10px] truncate tracking-tight",
                isPremium ? "text-[#b8a994]" : "text-muted-foreground"
              )}>{user.email}</p>
            </div>
          </Link>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center w-full py-3 rounded-xl text-xs font-bold transition-all duration-300 group relative",
            isPremium 
              ? "text-red-600/80 hover:bg-red-500/5 hover:text-red-600" 
              : "text-red-400/80 hover:bg-red-500/10 hover:text-red-400",
            isHovered ? "px-4 gap-4" : "justify-center px-0"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0 transition-all duration-300" />
          <span className={cn(
            "transition-all duration-300 overflow-hidden whitespace-nowrap",
            isHovered ? "opacity-100 max-w-[100px]" : "opacity-0 max-w-0"
          )}>
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
