import { Suspense } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  Link2,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { AdminGhostButton, AdminRefreshButton } from "@/features/admin/components/action-buttons";
import { AdminStoreHydrator } from "@/features/admin/components/admin-store-hydrator";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPageSkeleton,
  AdminPanel,
  AdminStatCard,
  AdminStatusBadge,
  formatCompactNumber,
  formatDateTime,
} from "@/features/admin/components/primitives";
import { getAdminDashboardData } from "@/features/admin/lib/server";

function DashboardBarChart({
  title,
  subtitle,
  rows,
  colorClass = "bg-amber-400",
}: {
  title: string;
  subtitle: string;
  rows: Array<{ label: string; value: number }>;
  colorClass?: string;
}) {
  const maxValue = Math.max(...rows.map((row) => row.value), 1);

  return (
    <AdminPanel title={title} description={subtitle}>
      {rows.length === 0 ? (
        <AdminEmptyState
          title="No chart data"
          description="Metrics will appear here once the admin analytics store has enough records to summarize."
        />
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const width = Math.max(10, Math.round((row.value / maxValue) * 100));

            return (
              <div key={row.label} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-white">{row.label}</span>
                  <span className="text-gray-400">{formatCompactNumber(row.value)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div
                    className={`h-2 rounded-full ${colorClass}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminPanel>
  );
}

function QuickAction({
  href,
  title,
  detail,
}: {
  href: string;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">{title}</p>
        <ArrowRight className="h-4 w-4 text-amber-300" />
      </div>
      <p className="mt-2 text-sm text-gray-400">{detail}</p>
    </Link>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const data = await getAdminDashboardData();
  const summary = data.summary || {};
  const attentionQueue = data.attentionQueue || [];
  const activityFeed = data.activityFeed || [];
  const systemServices = data.systemServices || [];
  const courseOverview = data.courseOverview || [];
  const institutions = data.institutions || [];
  const connections = data.connections || [];
  const userGrowth = (data.charts?.userGrowth || []).map((item) => ({
    label: item.month,
    value: Number(item.users || 0),
  }));
  const roleDistribution = (data.charts?.roleDistribution || []).map((item) => ({
    label: item.role,
    value: Number(item.count || 0),
  }));

  const primaryInstitution = institutions[0];
  const recentConnections = connections.slice(0, 5);
  const attentionTone =
    summary.systemStatus === "degraded"
      ? "critical"
      : summary.systemStatus === "watch"
        ? "warning"
        : "healthy";

  return (
    <div className="space-y-6">
      <AdminStoreHydrator stats={summary} />

      <AdminPageHeader
        eyebrow="Institution Control"
        title="Admin Dashboard"
        description="A live operational view of institution health, course readiness, user growth, and the attention points administrators need to close quickly."
        icon={ShieldCheck}
        actions={
          <>
            <AdminRefreshButton />
            <AdminGhostButton
              label="Share snapshot"
              message="Dashboard snapshot prepared"
            />
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Students"
          value={formatCompactNumber(summary.totalStudents)}
          helper={`${formatCompactNumber(summary.activeUsers)} active users across scope`}
          icon={Users}
        />
        <AdminStatCard
          label="Faculty"
          value={formatCompactNumber(summary.totalTeachers)}
          helper={`${formatCompactNumber(summary.totalConnections)} stakeholder link(s) connected`}
          icon={Users}
        />
        <AdminStatCard
          label="Courses"
          value={formatCompactNumber(summary.totalCourses)}
          helper={`${summary.activeCourses || 0} published, ${summary.draftCourses || 0} draft`}
          icon={BookOpen}
        />
        <AdminStatCard
          label="System Health"
          value={summary.systemHealthLabel || "0%"}
          helper={`${summary.attentionRequired || 0} queue item(s), ${summary.securityAlerts || 0} high alert(s)`}
          icon={Zap}
          tone="highlight"
        />
      </div>

      <AdminPanel
        title="Operational Pulse"
        description="Institution-wide posture synthesized from onboarding, course readiness, grading flow, and security signal volume."
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-300/80">
                  Current State
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {summary.systemStatus === "degraded"
                    ? "Immediate intervention recommended"
                    : summary.systemStatus === "watch"
                      ? "Stable, but needs operator attention"
                      : "Institution systems are tracking cleanly"}
                </h2>
                <p className="mt-3 max-w-2xl text-sm text-gray-400">
                  The dashboard is now driven from the real admin analytics payload, so these indicators reflect actual scoped users,
                  courses, activity, and institution linkage instead of placeholder counts.
                </p>
              </div>
              <AdminStatusBadge
                label={String(summary.systemStatus || "healthy")}
                tone={attentionTone}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                label: "Institutions",
                value: formatCompactNumber(summary.totalInstitutions),
                icon: Building2,
              },
              {
                label: "Connections",
                value: formatCompactNumber(summary.totalConnections),
                icon: Link2,
              },
              {
                label: "AI Queue Signal",
                value: summary.aiUsagePercentage || "0%",
                icon: Sparkles,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <item.icon className="h-4 w-4 text-amber-300" />
                </div>
                <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </AdminPanel>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminPanel
          title="Attention Queue"
          description="Critical operational signals pulled from the live admin backend and routed only to valid admin destinations."
        >
          {attentionQueue.length ? (
            <div className="space-y-4">
              {attentionQueue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-400">{item.detail}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <AdminStatusBadge label={item.severity} tone={item.severity} />
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300"
                        >
                          Open
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              title="No operational alerts"
              description="The attention queue is currently clear. New alerts from compliance, grading, identity, or institution linkage systems will show here."
            />
          )}
        </AdminPanel>

        <AdminPanel
          title="Quick Actions"
          description="Jump directly into the most common admin workflows."
        >
          <div className="grid gap-3">
            <QuickAction
              href="/admin/teachers"
              title="Review faculty coverage"
              detail="Inspect educator ownership, workload, and orphaned teaching accounts."
            />
            <QuickAction
              href="/admin/courses"
              title="Check course readiness"
              detail="Audit published vs draft catalog coverage and grading backlog."
            />
            <QuickAction
              href="/admin/institution"
              title="Validate institution setup"
              detail="Confirm departments, programs, and stakeholder links are complete."
            />
            <QuickAction
              href="/admin/security"
              title="Inspect security posture"
              detail="Review account state, audit posture, and privileged admin visibility."
            />
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardBarChart
          title="User Growth"
          subtitle="Recent cumulative onboarding movement inside the current admin scope."
          rows={userGrowth}
        />
        <DashboardBarChart
          title="Role Distribution"
          subtitle="How the current institution breaks down across students, faculty, and admins."
          rows={roleDistribution}
          colorClass="bg-blue-400"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminPanel
          title="Institution Snapshot"
          description="Primary institution structure and recent stakeholder connectivity."
        >
          {primaryInstitution ? (
            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300/80">
                      Primary Institution
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">
                      {primaryInstitution.institution_name || "Institution"}
                    </h3>
                  </div>
                  <AdminStatusBadge
                    label={primaryInstitution.health || "connected"}
                    tone={primaryInstitution.health}
                  />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Departments", primaryInstitution.departmentCount || 0],
                    ["Programs", primaryInstitution.programCount || 0],
                    ["Stakeholders", primaryInstitution.stakeholderCount || 0],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">{label}</p>
                      <p className="mt-2 text-xl font-semibold text-white">{formatCompactNumber(Number(value))}</p>
                    </div>
                  ))}
                </div>
              </div>

              {recentConnections.length ? (
                <div className="space-y-3">
                  {recentConnections.map((connection) => (
                    <div
                      key={connection.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {connection.userName || connection.userEmail || "Stakeholder"}
                          </p>
                          <p className="mt-1 text-sm text-gray-400">
                            {(connection.userRole || "member").replaceAll("_", " ")} linked to{" "}
                            {connection.institutionName || "institution"}
                            {connection.programName ? ` - ${connection.programName}` : ""}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(connection.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <AdminEmptyState
                  title="No stakeholder connections yet"
                  description="Once administrators connect users to institutions and programs, recent links will appear here."
                />
              )}
            </div>
          ) : (
            <AdminEmptyState
              title="No institution snapshot available"
              description="The admin analytics backend has not reported a primary institution yet."
            />
          )}
        </AdminPanel>

        <AdminPanel
          title="Activity Feed"
          description="Recent admin-visible events, onboarding movement, and institutional linking activity."
        >
          {activityFeed.length ? (
            <div className="space-y-4">
              {activityFeed.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-400">{item.detail}</p>
                    </div>
                    <AdminStatusBadge
                      label={item.tone || "info"}
                      tone={item.tone}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500">
                    <span>{formatDateTime(item.timestamp)}</span>
                    {item.href ? (
                      <Link href={item.href} className="inline-flex items-center gap-1 text-amber-300">
                        Open
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              title="No activity yet"
              description="Recent onboarding and stakeholder activity will appear once the institution starts using the admin workflow."
            />
          )}
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <AdminPanel
          title="Course Snapshot"
          description="Published catalog quality, module depth, and grading throughput."
        >
          {courseOverview.length ? (
            <div className="space-y-4">
              {courseOverview.slice(0, 6).map((course) => (
                <div key={course.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{course.title}</p>
                      <p className="mt-1 text-sm text-gray-400">
                        {course.studentCount} learners, {course.assignmentCount} assignments, {course.moduleCount} modules
                      </p>
                    </div>
                    <AdminStatusBadge
                      label={course.status}
                      tone={String(course.status).toLowerCase()}
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-200/80">
                    <Activity className="h-4 w-4" />
                    {course.pendingGrading} pending grading item(s)
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              title="No courses connected"
              description="Course analytics will appear here after curriculum data is linked to the institution."
              href="/admin/courses"
              actionLabel="Open courses"
            />
          )}
        </AdminPanel>

        <AdminPanel
          title="Admin Focus Areas"
          description="A concise breakdown of what the current dashboard is measuring."
        >
          <div className="grid gap-3">
            {[
              {
                icon: ShieldCheck,
                title: "Governance",
                detail: "Account state, security posture, and privileged oversight.",
              },
              {
                icon: Building2,
                title: "Institution Readiness",
                detail: "Department, program, and stakeholder linkage completeness.",
              },
              {
                icon: BookOpen,
                title: "Curriculum Operations",
                detail: "Catalog publication state, module depth, and grading backlog.",
              },
              {
                icon: BarChart3,
                title: "Growth Tracking",
                detail: "Live user onboarding movement and scoped role distribution.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-2 text-amber-300">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-400">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
