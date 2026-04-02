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
Search,
Target,
Award,
Clock,

// ✅ MERGED (counselor branch)
AlertTriangle,
Activity,
Zap,
Lock,
Share2,
BarChart,

// ✅ MERGED (main branch)
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

/* ================= ROLE NAV ================= */
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

counselor: [
{ name: "Dashboard", href: "/counselor/dashboard", icon: LayoutDashboard },
{ name: "At-Risk Students", href: "/counselor/at-risk", icon: AlertTriangle },
{ name: "Behavior Analytics", href: "/counselor/behavior-analytics", icon: Activity },
{ name: "Interventions", href: "/counselor/interventions", icon: Zap },
{ name: "Session Notes", href: "/counselor/notes", icon: Lock },
{ name: "Referrals", href: "/counselor/referrals", icon: Share2 },
{ name: "Communication", href: "/counselor/communication", icon: MessageSquare },
{ name: "Reports", href: "/counselor/reports", icon: BarChart },
{ name: "Notifications", href: "/counselor/notifications", icon: Bell },
{ name: "Settings", href: "/counselor/settings", icon: Settings },
],
};

/* ================= PROFILE ================= */
const profileHrefByRole: Record<string, string> = {
student: "/student/profile",
counselor: "/counselor/settings",
};

/* ================= COMPONENT ================= */
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

const handleLogout = useCallback(async () => {
await api.logout();
clearAuth();
router.push("/login");
}, [clearAuth, router]);

const currentRole = (user?.role as string) || "student";

const navItems = useMemo(() => {
const items = roleNavItems[currentRole] ?? roleNavItems.student;
return items.filter((item) => !item.isPrototype || IS_PROTOTYPE);
}, [currentRole]);

const profileHref =
profileHrefByRole[currentRole] ?? getRoleHome(currentRole);

return ( <aside className="lumina-sidebar fixed left-4 top-4 bottom-4 flex flex-col z-50">

```
  <div className="flex items-center border-b border-white/5">
    <Link href="/" className="text-2xl font-bold flex gap-1">
      <span>Lumina</span>
      <span className="text-yellow-400">AI</span>
    </Link>

    <button onClick={onClose} className="lg:hidden ml-auto">
      <X />
    </button>
  </div>

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
