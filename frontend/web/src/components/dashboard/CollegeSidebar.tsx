"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Building2,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const navItems = [
  { name: "Dashboard", href: "/college", icon: LayoutDashboard },
  { name: "Departments", href: "/college/departments", icon: Building2 },
  { name: "Programs & Classes", href: "/college/classes", icon: BookOpen },
  { name: "Users", href: "/college/users", icon: Users },
  { name: "Settings", href: "/college/settings", icon: Settings },
];

export default function CollegeSidebar({
  isHovering,
  onHoverChange,
}: {
  isHovering?: boolean;
  onHoverChange?: (hovered: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

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
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className={cn(
        "fixed left-4 top-4 bottom-4 glass-v2-gold border-white/5 shadow-premium z-50 transition-all duration-300 ease-in-out flex flex-col overflow-hidden",
        isHovering ? "w-64" : "w-20",
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-white/5 shrink-0 transition-all duration-300",
          isHovering ? "h-20 px-6" : "h-16 px-4 justify-center",
        )}
      >
        <Link href="/" className="font-display font-black text-2xl flex items-center select-none truncate">
          <span className="text-white shrink-0">L</span>
          <span className={cn(
            "text-white transition-all duration-300 overflow-hidden whitespace-nowrap",
            isHovering ? "max-w-[100px] opacity-100" : "max-w-0 opacity-0"
          )}>umina</span>
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
                isHovering ? "px-4" : "justify-center px-0",
                isActive
                  ? "bg-lumina-highlight/15 text-lumina-highlight border border-lumina-highlight/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  : "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-all duration-300 shrink-0",
                  isHovering ? "mr-3" : "mr-0",
                  isActive
                    ? "text-lumina-highlight"
                    : "text-gray-500 group-hover:text-gray-300",
                )}
              />
              <span
                className={cn(
                  "transition-all duration-300 whitespace-nowrap overflow-hidden truncate",
                  isHovering ? "max-width-[200px] opacity-100" : "max-w-0 opacity-0",
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "p-4 border-t border-white/10 space-y-4 transition-all duration-300 shrink-0",
          !isHovering && "px-3",
        )}
      >
        {user && (
          <Link
            href="/college/settings"
            className={cn(
              "flex items-center rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden",
              isHovering ? "p-3 gap-3" : "p-2 justify-center",
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
                "min-w-0 transition-all duration-300",
                isHovering ? "max-width-[150px] opacity-100" : "max-w-0 opacity-0",
              )}
            >
              <p className="text-xs font-bold text-white truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-gray-400 truncate tracking-tight">
                College Admin
              </p>
            </div>
          </Link>
        )}

        <button
          onClick={handleLogout}
          suppressHydrationWarning
          className={cn(
            "flex items-center w-full py-2 text-xs font-bold text-red-400/80 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-300",
            isHovering ? "px-4" : "justify-center px-0",
          )}
        >
          <LogOut
            className={cn(
              "h-4 w-4 transition-all duration-300",
              isHovering ? "mr-3" : "mr-0",
            )}
          />
          <span
            className={cn(
              "transition-all duration-300 whitespace-nowrap overflow-hidden",
              isHovering ? "max-width-[100px] opacity-100" : "max-w-0 opacity-0",
            )}
          >
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
