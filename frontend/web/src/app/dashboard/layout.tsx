"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { normalizeRole, getExpectedRoleForPath } from "@/lib/role-routing";
import { toast } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const protectRoute = async () => {
      try {
        const user = await api.getCurrentUser();
        if (!user) {
          router.push("/login?reason=unauthorized");
          return;
        }

        // Check onboarding status
        const status = await api.getOnboardingStatus();
        if (!status.completed) {
          router.push("/onboarding");
          return;
        }

        // RBC Enforcment: Zero-Overlap Check
        const currentRole = normalizeRole(user.role);
        const expectedRole = getExpectedRoleForPath(pathname);

        if (expectedRole && currentRole !== expectedRole) {
          toast.error("Unauthorized access to this dashboard role.");
          router.push("/dashboard"); // Redirect to their own dashboard
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error("Dashboard protection error:", err);
        router.push("/login");
      }
    };

    protectRoute();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090909]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-lumina-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-lumina-primary rounded-full border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090909] text-white">
      {children}
    </div>
  );
}
