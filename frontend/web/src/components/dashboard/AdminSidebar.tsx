"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
LayoutDashboard,
Users,
Settings,
LogOut,

// ✅ MERGED ICONS
Shield,
ShieldCheck,
Landmark,
Building2,
Bot,
CreditCard,
BarChart3,
Activity,
Scale,
Lock,
ScrollText,
FileDown,
FileText,
Bell,
Link2,
History,
UserCog,

} from "lucide-react";

import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

/* ================= NAV ITEMS ================= */

const navItems = [
{ name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },

// USERS
{ name: "User Management", href: "/admin/users", icon: Users },
{ name: "Roles & Permissions", href: "/admin/governance/role-permissions", icon: ShieldCheck },

// INSTITUTION
{ name: "Institution Management", href: "/admin/institution", icon: Landmark },
{ name: "Departments", href: "/admin/departments", icon: Building2 },

// AI
{ name: "AI Model Control", href: "/admin/ai/model-hub", icon: Bot },
{ name: "AI Usage & Cost", href: "/admin/ai-usage", icon: Bot },

// BILLING
{ name: "Billing & Subscriptions", href: "/admin/platform/billing", icon: CreditCard },

// ANALYTICS
{ name: "Analytics", href: "/admin/analytics/institution", icon: BarChart3 },
{ name: "Reports & Export", href: "/admin/analytics/reports", icon: FileText },

// SYSTEM
{ name: "System Health", href: "/admin/governance/system-health", icon: Activity },
{ name: "Compliance", href: "/admin/compliance/dashboard", icon: Scale },
{ name: "Audit Logs", href: "/admin/compliance/audit-logs", icon: ScrollText },

// INTEGRATIONS
{ name: "Integrations", href: "/admin/integrations", icon: Link2 },

// ALERTS
{ name: "Alert Configuration", href: "/admin/alert-config", icon: Bell },
{ name: "Notifications", href: "/admin/notifications", icon: Bell },

// SETTINGS
{ name: "Settings", href: "/admin/settings", icon: Settings },
];

/* ================= COMPONENT ================= */

export default function AdminSidebar({ user: userProp }: { user?: any }) {
const pathname = usePathname();
const router = useRouter();

const [user, setUser] = useState<any>(userProp ?? null);
const [isHovered, setIsHovered] = useState(false);

useEffect(() => {
if (userProp !== undefined) return;
api.getCurrentUser().then(setUser).catch(() => {});
}, [userProp]);

const handleLogout = async () => {
await api.logout();
router.push("/login");
};

return (
<aside
onMouseEnter={() => setIsHovered(true)}
onMouseLeave={() => setIsHovered(false)}
className={cn(
"fixed left-4 top-4 bottom-4 glass-v2-gold border-white/5 shadow-premium z-50 transition-all duration-500 hidden lg:flex flex-col overflow-hidden",
!isHovered ? "w-20" : "w-64",
)}
>
{/* LOGO */}
<div className={cn("flex items-center border-b border-white/5", !isHovered ? "justify-center h-16" : "px-6 h-20")}> <Link href="/" className="text-2xl font-bold flex gap-1"> <span>{!isHovered ? "L" : "Lumina"}</span> <span className="text-yellow-400">AI</span> </Link> </div>

```
  {/* NAV */}
  <nav className="p-4 flex-1 overflow-y-auto">
    {navItems.map((item) => {
      const isActive = pathname === item.href;

      return (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            "flex items-center py-3 rounded-xl transition",
            !isHovered ? "justify-center" : "px-4",
            isActive ? "bg-yellow-500/20 text-yellow-400" : "text-gray-400"
          )}
        >
          <item.icon className="w-5 h-5" />
          {isHovered && <span className="ml-3">{item.name}</span>}
        </Link>
      );
    })}
  </nav>

  {/* USER */}
  <div className="p-3 border-t">
    {user && (
      <div className="flex items-center gap-2">
        <img
          src={`https://ui-avatars.com/api/?name=${user.name}`}
          className="w-8 h-8 rounded-full"
        />
        {isHovered && (
          <div>
            <p>{user.name}</p>
            <p className="text-xs">{user.email}</p>
          </div>
        )}
      </div>
    )}

    <button onClick={handleLogout} className="mt-3 text-red-400">
      Logout
    </button>
  </div>
</aside>
```

);
}
