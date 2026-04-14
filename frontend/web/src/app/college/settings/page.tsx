"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function CollegeSettingsPage() {
  const [college, setCollege] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const institutions = await api.getInstitutions();
      setCollege(institutions?.[0] || null);
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      <section className="glass-v2 border-white/5 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight/80">
          College Settings
        </p>
        <h1 className="mt-3 text-3xl font-display font-bold text-white">
          Profile & Login Policy
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Update college identity, academic year, and login policy in Supabase.
        </p>
      </section>

      <section className="glass-v2 border-white/5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">College</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {college?.institution_name || "Not set"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Login policy</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {college?.login_policy || "email_only"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Academic year</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {college?.academic_year || "Not configured"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Status</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {college?.is_active ? "Active" : "Inactive"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
