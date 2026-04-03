import { Suspense } from "react";
import { Activity, ArrowRight, BookOpen, ShieldCheck, Users, Zap } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <AdminStoreHydrator stats={summary} />

      <AdminPageHeader
        eyebrow="Institution Control"
        title="Admin Dashboard"
        description="Monitor institution health, route attention quickly, and keep the Lumina platform stable without leaving the App Router shell."
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
          helper="Live learners under institutional scope"
          icon={Users}
        />
        <AdminStatCard
          label="Teachers"
          value={formatCompactNumber(summary.totalTeachers)}
          helper="Faculty and HODs with active visibility"
          icon={Users}
        />
        <AdminStatCard
          label="Courses"
          value={formatCompactNumber(summary.totalCourses)}
          helper={`${summary.activeCourses || 0} published, ${summary.draftCourses || 0} in review`}
          icon={BookOpen}
        />
        <AdminStatCard
          label="AI Usage"
          value={summary.aiUsagePercentage || "0%"}
          helper={`${summary.attentionRequired || 0} queue item(s) need attention`}
          icon={Zap}
          tone="highlight"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <AdminPanel
          title="Attention Queue"
          description="Critical operational signals pulled directly from the admin backend."
        >
          {attentionQueue.length ? (
            <div className="space-y-4">
              {attentionQueue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-400">{item.detail}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <AdminStatusBadge
                        label={item.severity}
                        tone={item.severity}
                      />
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
              description="The attention queue is currently clear. New alerts from compliance, grading, or identity systems will show here."
            />
          )}
        </AdminPanel>

        <AdminPanel
          title="System Services"
          description="At-a-glance status for the services the admin team depends on."
        >
          <div className="space-y-3">
            {systemServices.map((service) => (
              <div
                key={service.name}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{service.name}</p>
                    <p className="mt-1 text-sm text-gray-400">{service.detail}</p>
                  </div>
                  <AdminStatusBadge
                    label={service.status}
                    tone={service.status}
                  />
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80">
                  {service.metric}
                </p>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminPanel
          title="Activity Feed"
          description="Recent admin-visible events and onboarding movement."
        >
          <div className="space-y-4">
            {activityFeed.length ? (
              activityFeed.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-400">{item.detail}</p>
                    </div>
                    <AdminStatusBadge
                      label={item.tone || "info"}
                      tone={item.tone}
                    />
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    {formatDateTime(item.timestamp)}
                  </p>
                </div>
              ))
            ) : (
              <AdminEmptyState
                title="No activity yet"
                description="Recent onboarding and stakeholder activity will appear once the institution starts using the new dashboard."
              />
            )}
          </div>
        </AdminPanel>

        <AdminPanel
          title="Course Snapshot"
          description="Published catalog quality and grading throughput."
        >
          {courseOverview.length ? (
            <div className="space-y-4">
              {courseOverview.slice(0, 5).map((course) => (
                <div key={course.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
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
      </div>
    </div>
  );
}
