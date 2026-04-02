"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Shield,
  Landmark,
  Bot,
  CreditCard,
  BarChart3,
  Activity,
  Lock,
  ScrollText,
  FileDown,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const navItems = [
  { name: "Dashboard",              href: "/admin/dashboard",                  icon: LayoutDashboard },
  { name: "Institution Management", href: "/admin/institution",                icon: Landmark },
  { name: "Global User Overview",   href: "/admin/users",                      icon: Users },
  { name: "AI Model Control",       href: "/admin/ai/model-hub",               icon: Bot },
  { name: "Billing & Subscriptions",href: "/admin/platform/billing",           icon: CreditCard },
  { name: "Platform Analytics",     href: "/admin/analytics/institution",      icon: BarChart3 },
  { name: "System Health",          href: "/admin/governance/system-health",   icon: Activity },
  { name: "Compliance & Security",  href: "/admin/compliance/dashboard",       icon: Lock },
  { name: "Audit Logs",             href: "/admin/compliance/audit-logs",      icon: ScrollText },
  { name: "Reports & Export",       href: "/admin/analytics/reports",          icon: FileDown },
  { name: "Notifications",          href: "/admin/notifications",              icon: Bell },
  { name: "Settings",               href: "/admin/settings",                   icon: Settings },
];

export default function AdminSidebar({ user: userProp }: { user?: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(userProp ?? null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (userProp !== undefined) return; // parent already supplied user
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
        "fixed left-4 top-4 bottom-4 glass-v2-gold border-white/5 shadow-premium z-50 transition-all duration-500 ease-in-out hidden lg:flex flex-col overflow-hidden",
        !isHovered ? "w-20" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b border-white/5 shrink-0 transition-all duration-500",
          !isHovered ? "h-16 px-4 justify-center" : "h-20 px-6",
        )}
      >
        <Link href="/" className="text-2xl font-display font-black flex items-center gap-2">
          <span className="text-white">{!isHovered ? "L" : "Lumina"}</span>
          <span className="text-lumina-highlight">AI</span>
        </Link>
      </div>

      <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto hide-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              suppressHydrationWarning
              className={cn(
                "flex items-center py-3 text-sm font-semibold rounded-xl transition-all duration-300 relative group min-w-0",
                !isHovered ? "justify-center px-0" : "px-4",
                isActive
                  ? "bg-lumina-highlight/15 text-lumina-highlight border border-lumina-highlight/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  : "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-all duration-500 shrink-0",
                  !isHovered ? "mr-0 scale-110" : "mr-3",
                  isActive
                    ? "text-lumina-highlight"
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
        {/* User Profile Snippet */}
        {user && (
          <Link
            href="/admin/platform/profile"
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
