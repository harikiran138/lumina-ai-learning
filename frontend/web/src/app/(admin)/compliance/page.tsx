import { Suspense } from "react";
import Link from "next/link";
import { FileWarning, Scale, ShieldAlert, Trash2 } from "lucide-react";

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
import { getAdminComplianceData } from "@/features/admin/lib/server";

export default function AdminCompliancePage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <ComplianceContent />
    </Suspense>
  );
}

async function ComplianceContent() {
  const data = await getAdminComplianceData();
  const summary = data.summary || {};
  const deletionRequests = data.deletion_requests || [];
  const auditLogs = data.audit_logs || [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Trust & Safety"
        title="Compliance"
        description="Review deletion requests, audit events, and operational risk markers from the backend compliance summary."
        icon={Scale}
        actions={<AdminRefreshButton />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Open Deletions"
          value={`${summary.open_deletions || 0}`}
          helper="Requests waiting to be processed"
          icon={Trash2}
        />
        <AdminStatCard
          label="Completed"
          value={`${summary.completed_deletions || 0}`}
          helper="Deletion workflows finished"
          icon={Trash2}
        />
        <AdminStatCard
          label="Audit Events"
          value={`${summary.audit_events || 0}`}
          helper="Recent immutable audit rows"
          icon={FileWarning}
        />
        <AdminStatCard
          label="High Severity"
          value={`${summary.high_severity_events || 0}`}
          helper="Events that likely need manual review"
          icon={ShieldAlert}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <AdminPanel
          title="Deletion Requests"
          description="The latest deletion requests returned by the compliance endpoint."
          action={
            <Link
              href="/admin/guardian-log"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Open guardian log
            </Link>
          }
        >
          {deletionRequests.length ? (
            <div className="space-y-4">
              {deletionRequests.slice(0, 8).map((request, index) => (
                <div
                  key={String(request.id || index)}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {String(request.user_id || request.email || "Deletion request")}
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        {formatDateTime(String(request.created_at || ""))}
                      </p>
                    </div>
                    <AdminStatusBadge
                      label={String(request.status || "pending")}
                      tone={String(request.status || "pending").toLowerCase()}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              title="No deletion requests"
              description="Deletion workflows will surface here as soon as the compliance system receives them."
            />
          )}
        </AdminPanel>

        <AdminPanel
          title="Audit Log"
          description="High-level audit log rows with severity and timestamps."
        >
          {auditLogs.length ? (
            <div className="space-y-4">
              {auditLogs.slice(0, 8).map((log, index) => (
                <div
                  key={String(log.id || index)}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {String(log.action || log.event || "Audit event")}
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        {String(log.description || log.resource_id || "No extra context")}
                      </p>
                    </div>
                    <AdminStatusBadge
                      label={String(log.severity || log.level || "info")}
                      tone={String(log.severity || log.level || "info").toLowerCase()}
                    />
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    {formatDateTime(String(log.created_at || ""))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              title="No audit rows"
              description="The compliance audit log is currently empty or unavailable."
            />
          )}
        </AdminPanel>
      </div>
    </div>
  );
}
