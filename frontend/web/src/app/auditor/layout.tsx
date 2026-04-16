"use client";

import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

export default function AuditorLayout({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Read role from JWT cookie (client-side decode)
    const cookieStr = document.cookie;
    const tokenMatch = cookieStr.match(/(?:access_token|refresh_token)=([^;]+)/);
    if (tokenMatch) {
      try {
        const payload = JSON.parse(atob(tokenMatch[1].split(".")[1]));
        setRole(payload.role ?? null);
      } catch {}
    }
    setChecked(true);
  }, []);

  if (checked && role !== "auditor" && role !== "super_admin" && role !== "system_admin") {
    redirect("/unauthorized");
  }

  return (
    <div data-role="auditor" className="min-h-screen bg-surface-950">
      {/* Persistent read-only banner */}
      <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500/10 border-b border-amber-500/25 px-4 py-2">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <span className="text-xs text-amber-300 font-medium tracking-wide">
          READ-ONLY MODE — All write operations are disabled for this session
        </span>
      </div>
      {children}
    </div>
  );
}
