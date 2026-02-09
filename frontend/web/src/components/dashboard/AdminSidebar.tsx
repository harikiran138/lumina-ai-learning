"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Database,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "System", href: "/admin/system", icon: Database },
  { name: "Security", href: "/admin/security", icon: Shield },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await api.logout();
    router.push("/login");
  };

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed left-4 top-4 bottom-4 backdrop-blur-3xl bg-black/40 border border-white/10 shadow-[20px_0_40px_rgba(0,0,0,0.4)] z-50 rounded-3xl transition-all duration-500 ease-in-out hidden lg:flex flex-col overflow-hidden",
        !isHovered ? "w-20" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center border-b border-white/10 transition-all duration-500 shrink-0",
          !isHovered ? "h-16" : "h-20",
        )}
      >
        <Link href="/" className="text-2xl font-bold flex items-center gap-2">
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
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto hide-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              suppressHydrationWarning
              className={cn(
                "flex items-center py-3 text-sm font-bold rounded-xl transition-all duration-300 relative group",
                !isHovered ? "justify-center px-0" : "px-4",
                isActive
                  ? "bg-lumina-primary/20 text-lumina-primary shadow-[0_0_15px_rgba(255,215,0,0.1)] border border-lumina-primary/10"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200 hover:translate-x-1",
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
                <div className="absolute left-full ml-4 px-2 py-1 bg-black/90 border border-white/10 rounded-md text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60]">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
      <div
        className={cn(
          "p-4 border-t border-white/10 transition-all duration-500 shrink-0",
          !isHovered && "px-3",
        )}
      >
        <button
          onClick={handleLogout}
          suppressHydrationWarning
          className={cn(
            "flex items-center w-full py-3 text-sm font-bold text-red-400/80 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-300",
            !isHovered ? "justify-center px-0" : "px-4",
          )}
        >
          <LogOut
            className={cn(
              "h-5 w-5 transition-all duration-500",
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
