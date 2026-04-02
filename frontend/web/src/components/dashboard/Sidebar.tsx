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
Award,
TrendingUp,
AlertTriangle,
Trophy,
RefreshCw,
Network,
NotebookPen,
ClipboardList,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { getRoleHome } from "@/lib/role-routing";
import { useAuthStore } from "@/store/useAuthStore";
import { IS_PROTOTYPE } from "@/lib/config";

/* =========================
ROLE NAVIGATION CONFIG
========================= */
const roleNavItems: Record<string, any[]> = {
student: [
{ name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
{ name: "Enrollment", href: "/student/enrollment", icon: CheckCircle, isPrototype: true },
{ name: "Attendance", href: "/student/attendance", icon: Calendar, isPrototype: true },
{ name: "My Courses", href: "/student/courses", icon: BookOpen, isPrototype: true },
{ name: "Assignments", href: "/student/assignments", icon: FileText, isPrototype: true },
{ name: "Results", href: "/student/grades", icon: BarChart2, isPrototype: true },
{ name: "AI Tutor", href: "/student/ai_tutor", icon: Bot },
{ name: "Assessment", href: "/student/assessment", icon: Brain, isPrototype: true },
{ name: "Progress", href: "/student/progress", icon: BarChart2, isPrototype: true },
{ name: "Knowledge Graph", href: "/student/progress/knowledge-graph", icon: Network, isPrototype: true },
{ name: "Daily Revision", href: "/student/spaced_repetition", icon: RefreshCw },
{ name: "Exam Readiness", href: "/student/exam_readiness", icon: ClipboardList },
{ name: "Community", href: "/student/community", icon: MessageSquare, isPrototype: true },
{ name: "Leaderboard", href: "/student/leaderboard", icon: Trophy, isPrototype: true },
{ name: "Achievements", href: "/student/achievements", icon: Award, isPrototype: true },
{ name: "My Notes", href: "/student/my_notes", icon: NotebookPen, isPrototype: true },
{ name: "Profile", href: "/student/profile", icon: User },
{ name: "Settings", href: "/student/settings", icon: Settings },
],

parent: [
{ name: "Dashboard", href: "/parent/dashboard", icon: LayoutDashboard },
{ name: "Child Progress", href: "/parent/progress", icon: TrendingUp },
{ name: "Assignments", href: "/parent/assignments", icon: ClipboardList },
{ name: "Attendance", href: "/parent/attendance", icon: Calendar },
{ name: "Messages", href: "/parent/messages", icon: MessageSquare },
{ name: "Weekly Reports", href: "/parent/weekly-reports", icon: FileText },
{ name: "Alerts", href: "/parent/alerts", icon: AlertTriangle },
{ name: "Notifications", href: "/parent/alerts#notifications", icon: Bell },
{ name: "Settings", href: "/parent/settings", icon: Settings },
],

mentor: [
{ name: "Dashboard", href: "/mentor/dashboard", icon: LayoutDashboard },
{ name: "Settings", href: "/mentor/settings", icon: Settings },
],

peer_tutor: [
{ name: "Dashboard", href: "/peer_tutor/dashboard", icon: LayoutDashboard },
{ name: "Settings", href: "/peer_tutor/settings", icon: Settings },
],

counselor: [
{ name: "Dashboard", href: "/counselor/dashboard", icon: LayoutDashboard },
],

content_creator: [
{ name: "Dashboard", href: "/content_creator/dashboard", icon: LayoutDashboard },
{ name: "Designer Dashboard", href: "/designer", icon: BookOpen },
],

researcher: [
{ name: "Dashboard", href: "/researcher/dashboard", icon: LayoutDashboard },
],

alumni: [
{ name: "Dashboard", href: "/alumni/dashboard", icon: LayoutDashboard },
],

teacher: [
{ name: "Dashboard", href: "/faculty/dashboard", icon: LayoutDashboard },
{ name: "Courses", href: "/faculty/courses", icon: BookOpen, isPrototype: true },
{ name: "Students", href: "/faculty/students", icon: Users },
{ name: "Verification", href: "/faculty/verification", icon: CheckCircle, isPrototype: true },
{ name: "Settings", href: "/faculty/settings", icon: Settings },
],

admin: [
{ name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
{ name: "Users", href: "/admin/users", icon: Users },
{ name: "Institutions", href: "/admin/institutions", icon: BookOpen },
{ name: "Settings", href: "/admin/settings", icon: Settings },
],
};

/* =========================
PROFILE ROUTING
========================= */
const profileHrefByRole: Record<string, string> = {
student: "/student/profile",
teacher: "/faculty/settings",
admin: "/admin/platform/profile",
parent: "/parent/settings",
mentor: "/mentor/settings",
peer_tutor: "/peer_tutor/settings",
counselor: "/counselor/dashboard",
alumni: "/alumni/dashboard",
researcher: "/researcher/dashboard",
content_creator: "/content_creator/dashboard",
};

/* =========================
SIDEBAR COMPONENT
========================= */
export default function Sidebar({
isOpen,
onClose,
isCollapsed = true,
}: {
isOpen?: boolean;
onClose?: () => void;
isCollapsed?: boolean;
}) {
const pathname = usePathname();
const router = useRouter();

const { user: storeUser, setUser, clearAuth } = useAuthStore();
const [user, setLocalUser] = useState<any>(storeUser ?? null);

/* ===== USER FETCH ===== */
useEffect(() => {
if (storeUser) {
setLocalUser(storeUser);
return;
}

```
api.getCurrentUser().then((data) => {
  if (data) {
    setLocalUser(data);
    setUser(data as any);
  }
});
```

}, [storeUser, setUser]);

/* ===== LOGOUT ===== */
const handleLogout = useCallback(async () => {
await api.logout();
clearAuth();
router.push("/login");
}, [clearAuth, router]);

/* ===== ROLE ===== */
const currentRole = (user?.role as string) || "student";

const navItems = useMemo(() => {
const items = roleNavItems[currentRole] ?? roleNavItems.student;
return items.filter((item) => !item.isPrototype || IS_PROTOTYPE);
}, [currentRole]);

const profileHref =
profileHrefByRole[currentRole] ?? getRoleHome(currentRole);

/* ===== UI ===== */
return ( <aside className="lumina-sidebar fixed left-4 top-4 bottom-4 flex flex-col z-50">

```
  {/* LOGO */}
  <div className="flex items-center border-b border-white/5">
    <Link href="/" className="text-2xl font-bold flex gap-1">
      <span>Lumina</span>
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
          <item.icon className="w-5 h-5" />
          <span>{item.name}</span>
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
          className="w-8 h-8 rounded-full"
        />
        <div>
          <p>{user.name}</p>
          <p className="text-xs">{user.email}</p>
        </div>
      </Link>
    )}

    <button onClick={handleLogout} className="mt-3 text-red-400">
      Logout
    </button>
  </div>
</aside>
```

);
}
