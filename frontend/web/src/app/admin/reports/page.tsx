import { Suspense } from "react";
import { Bot, FileBarChart2, Layers3, ShieldAlert } from "lucide-react";

import { AdminGhostButton, AdminRefreshButton } from "@/features/admin/components/action-buttons";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPageSkeleton,
  AdminPanel,
  AdminStatCard,
  AdminStatusBadge,
  formatDateTime,
} from "@/features/admin/components/primitives";
import { getAdminReportsData } from "@/features/admin/lib/server";

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <ReportsContent />
    </Suspense>
  );
}

async function ReportsContent() {
  const data = await getAdminReportsData();
  const summary = data.summary || {};
  const attentionQueue = data.attention_queue || [];
  const activityFeed = data.activity_feed || [];
  const guardianEvents = data.guardian_events || [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Reporting Hub"
        title="Reports"
        description="Operational rollups for leadership, compliance, and AI oversight sourced directly from the admin report endpoint."
        icon={FileBarChart2}
        actions={
          <>
            <AdminRefreshButton />
            <AdminGhostButton
              label="Prepare export"
              message="Report export prepared"
            />
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Users"
          value={`${summary.totalUsers || 0}`}
          helper="Active scope in the latest report"
          icon={Layers3}
        />
        <AdminStatCard
          label="Institutions"
          value={`${summary.totalInstitutions || 0}`}
          helper="Institution count covered in the report"
          icon={Layers3}
        />
        <AdminStatCard
          label="Security Alerts"
          value={`${summary.securityAlerts || 0}`}
          helper="High severity items in the report"
          icon={ShieldAlert}
        />
        <AdminStatCard
          label="AI Spend"
          value={String(data.ai_usage?.total_cost || "$0.00")}
          helper={String(data.ai_usage?.usage_percentage || "0%")}
          icon={Bot}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminPanel
          title="Attention Summary"
          description="Items leadership or operations should review first."
        >
          {attentionQueue.length ? (
            <div className="space-y-4">
              {attentionQueue.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-400">{item.detail}</p>
                    </div>
                    <AdminStatusBadge label={item.severity} tone={item.severity} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              title="No attention items"
              description="The reporting endpoint did not return any items requiring immediate review."
            />
          )}
        </AdminPanel>

        <AdminPanel
          title="Guardian Events"
          description="Recent moderation and intervention signals included in the report."
        >
          {guardianEvents.length ? (
            <div className="space-y-4">
              {guardianEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {event.message || event.type || "Guardian event"}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {formatDateTime(event.timestamp)}
                      </p>
                    </div>
                    <AdminStatusBadge
                      label={event.severity || "info"}
                      tone={event.severity}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              title="No guardian signals"
              description="Guardian monitoring has not reported recent safety or intervention events."
            />
          )}
        </AdminPanel>
      </div>

      <AdminPanel
        title="Recent Report Activity"
        description={`Report generated ${formatDateTime(data.generated_at)}`}
      >
        {activityFeed.length ? (
          <div className="space-y-4">
            {activityFeed.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm text-gray-400">{item.detail}</p>
                <p className="mt-3 text-xs text-gray-500">
                  {formatDateTime(item.timestamp)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            title="No report activity"
            description="Recent administrative activity will appear here once the report endpoint observes it."
          />
        )}
      </AdminPanel>
    </div>
  );
}
