"use client";
import { useState, type ReactNode } from "react";

import { BGPattern } from "@/components/ui/BGPattern";
import { AdminStoreHydrator } from "@/features/admin/components/admin-store-hydrator";
import { AdminTopbar } from "@/features/admin/components/admin-topbar";
import type { AdminUser } from "@/features/admin/types";
import { useAdminShellStore } from "@/features/admin/store/use-admin-shell-store";
import { cn } from "@/lib/utils";
import Sidebar from "@/app/admin/sidebar";
import { RoleGuard } from "@/components/shared/RoleGuard";

export function AdminShell({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: AdminUser;
}) {
  const sidebarOpen = useAdminShellStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAdminShellStore((state) => state.setSidebarOpen);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  return (
    <RoleGuard allowedRoles={["admin", "super_admin", "system_admin", "institution_admin", "college_admin"]}>
      <div className="relative min-h-screen bg-neutral-950 text-white">
        <AdminStoreHydrator user={initialUser} />
        <BGPattern
          variant="grid"
          size={36}
          fill="rgba(245, 158, 11, 0.06)"
          className="pointer-events-none fixed inset-0"
        />

        <div className="relative flex min-h-screen">
          <Sidebar 
            isHovering={isSidebarHovered}
            onHoverChange={setIsSidebarHovered}
          />
          {sidebarOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-30 bg-neutral-950/70 lg:hidden"
              aria-label="Close admin navigation"
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}

          <div className={cn(
            "flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out",
            isSidebarHovered ? "lg:pl-72" : "lg:pl-20"
          )}>
            <AdminTopbar />
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-[1600px]">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
