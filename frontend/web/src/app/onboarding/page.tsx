"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import StudentOnboardingFlow from "@/components/onboarding/StudentOnboardingFlow";

import LegacyOnboardingPage from "./legacy-page";

export default function OnboardingPage() {
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadRole = async () => {
      const user = await api.getCurrentUser();
      setRole(user?.role || null);
      setReady(true);
    };

    loadRole();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#090909] px-6 py-12 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
          <div className="rounded-full border border-amber-300/15 bg-amber-300/10 px-5 py-3 text-sm text-amber-100">
            Loading onboarding
          </div>
        </div>
      </div>
    );
  }

  if (role === "student") {
    return <StudentOnboardingFlow />;
  }

  return <LegacyOnboardingPage />;
}
