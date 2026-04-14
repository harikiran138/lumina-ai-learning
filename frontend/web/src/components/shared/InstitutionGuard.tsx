"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";
import { normalizeRole } from "@/lib/role-routing";

/**
 * InstitutionGuard ensures the user belongs to an institution.
 * If the institution contexts are missing, it redirects to the onboarding flow.
 */
export function InstitutionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && user) {
      const hasInstitution = user.collegeId || user.institution_id || user.institutionId;
      const isSuperAdmin = ["super_admin", "system_admin"].includes(normalizeRole(user.role));
      
      if (!hasInstitution && !isSuperAdmin && !pathname.startsWith("/onboarding")) {
        console.warn("[InstitutionGuard] No institution context found. Redirecting to onboarding.");
        router.push("/onboarding");
      }
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060606]">
        <Loader2 className="h-8 w-8 animate-spin text-lumina-highlight" />
      </div>
    );
  }

  return <>{children}</>;
}
