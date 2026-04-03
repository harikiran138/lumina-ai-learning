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

export default function Sidebar() {
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
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/5 bg-slate-950/95 px-4 pb-4 pt-6 backdrop-blur-xl transition-transform duration-200 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="mb-8 flex items-center justify-between px-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-amber-300/70">
            Lumina
          </p>
          <h2 className="text-2xl font-semibold text-white">Admin Panel</h2>
        </div>
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
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                active
                  ? "bg-amber-500/15 text-white shadow-[0_0_0_1px_rgba(245,158,11,0.18)]"
                  : "text-gray-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {secondaryItems.length ? (
        <div className="mt-8">
          <p className="px-4 text-xs font-bold uppercase tracking-[0.24em] text-gray-500">
            Oversight
          </p>
          <div className="mt-3 space-y-2">
            {secondaryItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "bg-amber-500/15 text-white shadow-[0_0_0_1px_rgba(245,158,11,0.18)]"
                      : "text-gray-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-auto rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-semibold text-white">{user?.name || "Admin"}</p>
        <p className="mt-1 text-xs text-gray-400">
          {user?.email || "admin@lumina.ai"}
        </p>
        <p className="mt-3 text-xs text-amber-200/90">
          {isAdminRole(user?.role) ? "Admin access verified" : "Restricted access"}
        </p>
        <button
          type="button"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          onClick={async () => {
            await api.logout();
            router.push("/login");
          }}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

