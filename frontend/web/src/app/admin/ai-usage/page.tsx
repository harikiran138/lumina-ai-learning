import { Suspense } from "react";
import { Bot, Cpu, DollarSign, Gauge, Sparkles } from "lucide-react";

import { AdminRefreshButton } from "@/features/admin/components/action-buttons";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPageSkeleton,
  AdminPanel,
  AdminStatCard,
  AdminStatusBadge,
} from "@/features/admin/components/primitives";
import { getAdminAiUsageData } from "@/features/admin/lib/server";

export default function AdminAiUsagePage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AiUsageContent />
    </Suspense>
  );
}

async function AiUsageContent() {
  const { costs, queue } = await getAdminAiUsageData();
  const breakdown = costs.breakdown_by_model || [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="AI Operations"
        title="AI Usage"
        description="Track inference spend, verification backlog, and model mix across the institution."
        icon={Bot}
        actions={<AdminRefreshButton />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Total Tokens"
          value={`${costs.total_tokens || 0}`}
          helper="Measured from institutional AI usage"
          icon={Sparkles}
        />
        <AdminStatCard
          label="Spend"
          value={String(costs.total_cost || "$0.00")}
          helper={`Budget target ${String(costs.monthly_budget || "$0.00")}`}
          icon={DollarSign}
        />
        <AdminStatCard
          label="Budget Usage"
          value={String(costs.usage_percentage || "0%")}
          helper="Month-to-date utilization"
          icon={Gauge}
        />
        <AdminStatCard
          label="Verification Queue"
          value={`${queue.total_pending || 0}`}
          helper={`${queue.total_verified || 0} items verified`}
          icon={Cpu}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminPanel
          title="Model Cost Breakdown"
          description="Backend-provided token and cost allocation by model."
        >
          {breakdown.length ? (
            <div className="space-y-4">
              {breakdown.map((row) => (
                <div
                  key={row.model}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{row.model}</p>
                    <p className="mt-1 text-xs text-gray-400">{row.tokens} tokens</p>
                  </div>
                  <AdminStatusBadge label={row.cost} tone="healthy" />
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              title="No AI billing rows yet"
              description="Once AI usage is logged, token breakdowns will appear here automatically."
            />
          )}
        </AdminPanel>

        <AdminPanel
          title="Queue Health"
          description="Operational signals for the teacher verification pipeline."
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Pending reviews</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {queue.total_pending || 0}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Verified today</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {queue.total_verified || 0}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Average verification time</p>
              <p className="mt-2 text-lg text-amber-200/90">
                {queue.avg_verification_time || "Unavailable"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Backlog trend</p>
              <div className="mt-2">
                <AdminStatusBadge
                  label={queue.backlog_trend || "stable"}
                  tone={queue.backlog_trend === "decreasing" ? "healthy" : "warning"}
                />
              </div>
            </div>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
