"use client";

import { useEffect } from "react";

import { useAdminShellStore } from "@/features/admin/store/use-admin-shell-store";
import type { AdminShellStats, AdminUser } from "@/features/admin/types";

interface AdminStoreHydratorProps {
  user?: AdminUser | null;
  stats?: AdminShellStats | null;
}

export function AdminStoreHydrator({
  user,
  stats,
}: AdminStoreHydratorProps) {
  const setUser = useAdminShellStore((state) => state.setUser);
  const setAdminStats = useAdminShellStore((state) => state.setAdminStats);

  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [setUser, user]);

  useEffect(() => {
    if (stats) {
      setAdminStats(stats);
    }
  }, [setAdminStats, stats]);

  return null;
}

