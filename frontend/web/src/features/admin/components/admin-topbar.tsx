"use client";

import { Menu, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";

import { ADMIN_PAGE_TITLES } from "@/features/admin/config";
import { getAdminRoleLabel } from "@/features/admin/lib/roles";
import { useAdminShellStore } from "@/features/admin/store/use-admin-shell-store";

export function AdminTopbar() {
  const pathname = usePathname();
  const toggleSidebar = useAdminShellStore((state) => state.toggleSidebar);
  const user = useAdminShellStore((state) => state.user);
  const stats = useAdminShellStore((state) => state.adminStats);

  const title = ADMIN_PAGE_TITLES[pathname] || "Admin";
  const initials = user?.name?.trim().charAt(0).toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-neutral-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white lg:hidden"
            aria-label="Open admin navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300/70">
              Admin Workspace
            </p>
            <h1 className="truncate text-xl font-semibold text-white">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {stats?.attentionRequired ? (
            <div className="hidden rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-100 sm:block">
              {stats.attentionRequired} item(s) need review
            </div>
          ) : null}
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-white">{user?.name || "Admin"}</p>
              <p className="text-xs text-gray-400">
                {getAdminRoleLabel(user?.role)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 font-semibold text-neutral-950">
              {initials}
            </div>
            <ShieldCheck className="hidden h-4 w-4 text-emerald-300 sm:block" />
          </div>
        </div>
      </div>
    </header>
  );
}

