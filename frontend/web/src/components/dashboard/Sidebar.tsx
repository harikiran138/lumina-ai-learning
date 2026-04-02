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
}: {
isOpen?: boolean;
onClose?: () => void;
}) {
const pathname = usePathname();
const router = useRouter();

const { user: storeUser, setUser, clearAuth } = useAuthStore();
const [user, setLocalUser] = useState<any>(storeUser ?? null);
const [isHovered, setIsHovered] = useState(false);

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

return ( 
<aside 
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
  className={cn(
    "fixed left-4 top-4 bottom-4 glass-v2-gold border-white/5 shadow-premium z-50 transition-all duration-500 hidden lg:flex flex-col overflow-hidden",
    !isHovered ? "w-20" : "w-64",
    isOpen ? "!flex" : "hidden lg:flex"
  )}
>

  {/* LOGO */}
  <div className={cn("flex items-center border-b border-white/5", !isHovered ? "justify-center h-16" : "px-6 h-20")}> 
    <Link href="/" className="text-2xl font-bold flex gap-1"> 
      <span>{!isHovered ? "L" : "Lumina"}</span> 
      <span className="text-yellow-400">AI</span> 
    </Link>

    <button onClick={onClose} className="lg:hidden ml-auto">
      <X />
    </button>
  </div>

  {/* NAV */}
  <nav className="p-4 flex-1 overflow-y-auto">
    {navItems.map((item) => {
      const isActive = pathname === item.href;

      return (
        <Link
          key={item.name}
          href={item.href}
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl",
            isActive ? "bg-yellow-500/20 text-yellow-400" : "text-gray-400"
          )}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          {isHovered && <span>{item.name}</span>}
        </Link>
      );
    })}
  </nav>

  {/* USER */}
  <div className="border-t p-3">
    {user && (
      <Link href={profileHref} className="flex items-center gap-2">
        <img
          src={`https://ui-avatars.com/api/?name=${user.name}`}
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
        {isHovered && (
          <div className="overflow-hidden">
            <p className="truncate">{user.name}</p>
            <p className="text-xs truncate">{user.email}</p>
          </div>
        )}
      </Link>
    )}

    <button 
      onClick={handleLogout} 
      className={cn(
        "mt-3 text-red-400 flex items-center gap-3 w-full",
        !isHovered ? "justify-center" : "px-3"
      )}
    >
      <LogOut className="w-5 h-5" />
      {isHovered && <span>Logout</span>}
    </button>
  </div>
</aside>

);
}
