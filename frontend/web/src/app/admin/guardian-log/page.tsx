import { Suspense } from "react";
import { ShieldAlert, Siren, TriangleAlert, Waves } from "lucide-react";

import { AdminRefreshButton } from "@/features/admin/components/action-buttons";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPageSkeleton,
  AdminPanel,
  AdminStatCard,
  AdminStatusBadge,
  formatDateTime,
} from "@/features/admin/components/primitives";
import { getGuardianLogData } from "@/features/admin/lib/server";

export default function GuardianLogPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <GuardianLogContent />
    </Suspense>
  );
}

async function GuardianLogContent() {
  const entries = await getGuardianLogData();
  const highSeverity = entries.filter((entry) =>
    String(entry.severity || "").toLowerCase().includes("high"),
  ).length;
  const pending = entries.filter((entry) =>
    ["pending", "open"].includes(String(entry.status || "").toLowerCase()),
  ).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Guardian Monitoring"
        title="Guardian Log"
        description="Inspect moderation and intervention signals that feed the admin oversight workflow."
        icon={ShieldAlert}
        actions={<AdminRefreshButton />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Signals"
          value={`${entries.length}`}
          helper="Guardian events returned by the backend"
          icon={Waves}
        />
        <AdminStatCard
          label="High Severity"
          value={`${highSeverity}`}
          helper="Signals tagged as high severity"
          icon={TriangleAlert}
        />
        <AdminStatCard
          label="Pending"
          value={`${pending}`}
          helper="Signals waiting for review or action"
          icon={Siren}
        />
        <AdminStatCard
          label="Resolved"
          value={`${Math.max(entries.length - pending, 0)}`}
          helper="Signals already closed or processed"
          icon={ShieldAlert}
        />
      </div>

      <AdminPanel
        title="Guardian Timeline"
        description="Raw moderation and intervention events available to admins."
      >
        {entries.length ? (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {entry.message || entry.signal_type || entry.type || "Guardian event"}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      Source: {entry.source || "guardian"} • Status: {entry.status || "pending"}
                    </p>
                  </div>
                  <AdminStatusBadge
                    label={entry.severity || "info"}
                    tone={entry.severity}
                  />
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  {formatDateTime(entry.timestamp || entry.created_at)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            title="No guardian entries"
            description="Guardian monitoring has not produced any visible log entries yet."
          />
        )}
      </AdminPanel>
    </div>
  );
}
