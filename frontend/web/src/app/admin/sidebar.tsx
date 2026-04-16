"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import {
  ADMIN_NAV_ITEMS,
  ADMIN_SECONDARY_LINKS,
} from "@/features/admin/config";
import { isAdminRole } from "@/features/admin/lib/roles";
import { useAdminShellStore } from "@/features/admin/store/use-admin-shell-store";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function Sidebar({
  isHovering,
  onHoverChange,
}: {
  isHovering?: boolean;
  onHoverChange?: (hovered: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarOpen = useAdminShellStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAdminShellStore((state) => state.setSidebarOpen);
  const user = useAdminShellStore((state) => state.user);

  const visibleItems = ADMIN_NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.some((role) => role === user?.role),
  );
  const secondaryItems = ADMIN_SECONDARY_LINKS.filter(
    (item) => !item.roles || item.roles.some((role) => role === user?.role),
  );

  return (
    <aside
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/5 bg-neutral-950/95 pb-4 pt-6 backdrop-blur-xl transition-all duration-300 lg:translate-x-0",
        isHovering ? "w-72 px-4" : "w-20 px-3",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className={cn(
        "mb-8 flex items-center justify-between transition-all duration-300",
        isHovering ? "px-2" : "px-0 justify-center"
      )}>
        <div className={cn(
          "transition-all duration-300 overflow-hidden",
          isHovering ? "opacity-100" : "opacity-0 w-0"
        )}>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-amber-300/70">
            Lumina
          </p>
          <h2 className="text-2xl font-semibold text-white whitespace-nowrap">Admin Panel</h2>
        </div>
        {!isHovering && (
          <div className="text-2xl font-black text-white shrink-0">L</div>
        )}
        <button
          type="button"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          Close
        </button>
      </div>

      <nav className="space-y-2">
        {visibleItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-2xl py-3 text-sm font-semibold transition-all duration-300",
                isHovering ? "px-4" : "px-0 justify-center",
                active
                  ? "bg-amber-500/15 text-white shadow-[0_0_0_1px_rgba(245,158,11,0.18)]"
                  : "text-gray-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-all duration-300",
                active ? "text-amber-400" : "text-gray-500"
              )} />
              <span className={cn(
                "transition-all duration-300 overflow-hidden whitespace-nowrap truncate",
                isHovering ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {secondaryItems.length ? (
        <div className="mt-8">
          <p className={cn(
            "text-xs font-bold uppercase tracking-[0.24em] text-gray-500 transition-all duration-300 overflow-hidden whitespace-nowrap",
            isHovering ? "px-4 opacity-100" : "px-0 opacity-0 h-0"
          )}>
            Oversight
          </p>
          <div className={cn("mt-3 space-y-2", !isHovering && "mt-0")}>
            {secondaryItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl py-3 text-sm font-semibold transition-all duration-300",
                    isHovering ? "px-4" : "px-0 justify-center",
                    active
                      ? "bg-amber-500/15 text-white shadow-[0_0_0_1px_rgba(245,158,11,0.18)]"
                      : "text-gray-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 shrink-0 transition-all duration-300",
                    active ? "text-amber-400" : "text-gray-500"
                  )} />
                  <span className={cn(
                    "transition-all duration-300 overflow-hidden whitespace-nowrap truncate",
                    isHovering ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0"
                  )}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className={cn(
        "mt-auto rounded-3xl border border-white/10 bg-white/[0.04] transition-all duration-300",
        isHovering ? "p-4" : "p-2"
      )}>
        <div className={cn(
          "transition-all duration-300 overflow-hidden",
          isHovering ? "opacity-100" : "opacity-0 h-0"
        )}>
          <p className="text-sm font-semibold text-white truncate">{user?.name || "Admin"}</p>
          <p className="mt-1 text-xs text-gray-400 truncate">
            {user?.email || "admin@lumina.ai"}
          </p>
          <p className="mt-3 text-xs text-amber-200/90">
            {isAdminRole(user?.role) ? "Admin access verified" : "Restricted access"}
          </p>
        </div>
        <button
          type="button"
          className={cn(
            "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition hover:bg-white/10",
            isHovering ? "px-4" : "px-0 mt-0"
          )}
          onClick={async () => {
            await api.logout();
            router.push("/login");
          }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className={cn(
            "transition-all duration-300 overflow-hidden whitespace-nowrap",
            isHovering ? "max-w-[100px] opacity-100" : "max-w-0 opacity-0"
          )}>Logout</span>
        </button>
      </div>
    </aside>
  );
}
