"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";
import { normalizeRole } from "@/lib/role-routing";

/**
 * RoleGuard ensures the user has the required role to access a route.
 * If the user's role does not match, it redirects to their role's home page.
 */
export function RoleGuard({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[];
}) {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const normalizedUserRole = normalizeRole(user?.role);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?reason=unauthorized");
    } else if (!isLoading && user && !allowedRoles.includes(normalizedUserRole)) {
      console.warn(`[RoleGuard] Access denied for role: ${normalizedUserRole}. Allowed: ${allowedRoles.join(", ")}`);
      const { getRoleHome } = require("@/lib/role-routing");
      router.replace(getRoleHome(user.role));
    }
  }, [user, isLoading, allowedRoles, normalizedUserRole, router]);

  if (isLoading || !user || !allowedRoles.includes(normalizedUserRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060606]">
        <Loader2 className="h-8 w-8 animate-spin text-lumina-highlight" />
      </div>
    );
  }

  return <>{children}</>;
}
