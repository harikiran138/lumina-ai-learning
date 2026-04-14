import { Suspense } from "react";
import { KeyRound, Settings, Shield, Users } from "lucide-react";

import { AdminRefreshButton } from "@/features/admin/components/action-buttons";
import { SettingsForm } from "@/features/admin/components/settings-form";
import {
  AdminPageHeader,
  AdminPageSkeleton,
  AdminPanel,
  AdminStatCard,
} from "@/features/admin/components/primitives";
import { getAdminSettingsData } from "@/features/admin/lib/server";

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}

async function SettingsContent() {
  const { config, roleMatrix } = await getAdminSettingsData();
  const permissions = roleMatrix.permissions || {};

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Platform Governance"
        title="Settings"
        description="Adjust admin-wide controls, rate limits, and role permissions without leaving the persistent admin shell."
        icon={Settings}
        actions={<AdminRefreshButton />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Guardian Mode"
          value={String(config.guardian_mode || "active")}
          helper="Moderation policy applied to AI workflows"
          icon={Shield}
        />
        <AdminStatCard
          label="Rate Limit"
          value={String(config.api_rate_limit || 10000)}
          helper="Requests before admin throttling"
          icon={KeyRound}
        />
        <AdminStatCard
          label="Role Entries"
          value={`${roleMatrix.roles?.length || 0}`}
          helper="Roles defined in the matrix"
          icon={Users}
        />
        <AdminStatCard
          label="Permission Sets"
          value={`${Object.keys(permissions).length}`}
          helper="Backend-managed permission bundles"
          icon={Shield}
        />
      </div>

      <SettingsForm initialConfig={config} />

      <AdminPanel
        title="Role Matrix"
        description="Read-only summary of the permission mapping currently loaded from the backend."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(permissions).map(([permission, roles]) => (
            <div
              key={permission}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <p className="text-sm font-semibold text-white">{permission}</p>
              <p className="mt-2 text-sm text-gray-400">
                {(roles || []).join(", ") || "No roles assigned"}
              </p>
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}
