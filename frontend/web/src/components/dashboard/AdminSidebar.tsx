"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Database,
  Shield,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Institutions", href: "/admin/institution", icon: Landmark },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "System", href: "/admin/system", icon: Database },
  { name: "Security", href: "/admin/security", icon: Shield },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
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
        "fixed left-4 top-4 bottom-4 glass-v2 border-white/5 shadow-premium z-50 transition-all duration-500 ease-in-out hidden lg:flex flex-col overflow-hidden",
        !isHovered ? "w-20" : "w-64",
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
                "flex items-center py-3 text-sm font-semibold rounded-xl transition-all duration-300 relative group",
                !isHovered ? "justify-center px-0" : "px-4",
                isActive
                  ? "bg-lumina-primary/10 text-lumina-primary border border-lumina-primary/20 shadow-gold-glow"
                  : "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-all duration-500",
                  !isHovered ? "mr-0 scale-110" : "mr-3",
                  isActive
                    ? "text-lumina-primary"
                    : "text-gray-500 group-hover:text-gray-300",
                )}
              />
              <span
                className={cn(
                  "transition-all duration-500 whitespace-nowrap overflow-hidden",
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
            href="/admin/settings"
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
