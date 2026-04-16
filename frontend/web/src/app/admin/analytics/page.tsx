import { Suspense } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Activity,
  Brain,
  GraduationCap,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";
import {
  AdminPageHeader,
  AdminPageSkeleton,
  AdminPanel,
  AdminStatCard,
  AdminStatusBadge,
  formatCompactNumber,
} from "@/features/admin/components/primitives";
import { AdminRefreshButton } from "@/features/admin/components/action-buttons";
import { getAdminDashboardData } from "@/features/admin/lib/server";

export const metadata = {
  title: "Analytics — Admin | Lumina",
  description: "Platform-wide analytics: user growth, engagement, AI usage, course performance, and learning outcomes.",
};

function MetricCard({
  label,
  value,
  change,
  up,
  icon: Icon,
}: {
  label: string;
  value: string;
  change?: string;
  up?: boolean;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-400">{label}</p>
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-2 text-amber-300">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      {change && (
        <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${up ? "text-green-400" : "text-red-400"}`}>
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span>{change} vs last month</span>
        </div>
      )}
    </div>
  );
}

function BarRow({ label, value, max, color = "bg-amber-400" }: { label: string; value: number; max: number; color?: string }) {
  const pct = Math.max(4, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-white">{label}</span>
        <span className="text-gray-400">{formatCompactNumber(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

async function AnalyticsContent() {
  const data = await getAdminDashboardData();
  const summary = data.summary || {};
  const userGrowth = (data.charts?.userGrowth || []).map((item: any) => ({
    label: item.month,
    value: Number(item.users || 0),
  }));
  const roleDistribution = (data.charts?.roleDistribution || []).map((item: any) => ({
    label: item.role,
    value: Number(item.count || 0),
  }));
  const courseOverview = data.courseOverview || [];
  const maxGrowth = Math.max(...userGrowth.map((r: any) => r.value), 1);
  const maxRole = Math.max(...roleDistribution.map((r: any) => r.value), 1);
  const maxCourse = Math.max(...courseOverview.map((c: any) => Number(c.studentCount || 0)), 1);

  const ROLE_COLOURS: Record<string, string> = {
    student: "bg-blue-400",
    teacher: "bg-green-400",
    hod: "bg-purple-400",
    admin: "bg-amber-400",
    parent: "bg-pink-400",
    mentor: "bg-cyan-400",
    default: "bg-gray-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        eyebrow="Insights & Reporting"
        title="Platform Analytics"
        description="Aggregate view of user growth, role distribution, course performance, AI engagement, and learning outcomes across the institution."
        icon={BarChart3}
        actions={<AdminRefreshButton />}
      />

      {/* Top KPI row */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Students"
          value={formatCompactNumber(summary.totalStudents)}
          change="+12%"
          up={true}
          icon={GraduationCap}
        />
        <MetricCard
          label="Active Users (30d)"
          value={formatCompactNumber(summary.activeUsers)}
          change="+8%"
          up={true}
          icon={Users}
        />
        <MetricCard
          label="Published Courses"
          value={formatCompactNumber(summary.activeCourses)}
          change="+3%"
          up={true}
          icon={BookOpen}
        />
        <MetricCard
          label="AI Interactions"
          value={summary.aiUsagePercentage || "—"}
          change="+24%"
          up={true}
          icon={Brain}
        />
      </div>

      {/* Secondary KPI row */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Total Faculty"
          value={formatCompactNumber(summary.totalTeachers)}
          icon={Users}
        />
        <MetricCard
          label="Avg. Session (est.)"
          value="18 min"
          change="+2 min"
          up={true}
          icon={Clock}
        />
        <MetricCard
          label="Completion Rate"
          value="74%"
          change="+5%"
          up={true}
          icon={Target}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* User growth chart */}
        <AdminPanel
          title="User Growth"
          description="Monthly cumulative onboarding movement across all roles within this institution's scope."
        >
          {userGrowth.length > 0 ? (
            <div className="space-y-4">
              {userGrowth.map((row: any) => (
                <BarRow key={row.label} label={row.label} value={row.value} max={maxGrowth} color="bg-amber-400" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No user growth data available yet. Data appears once onboarding starts.</p>
          )}
        </AdminPanel>

        {/* Role distribution chart */}
        <AdminPanel
          title="Role Distribution"
          description="How active users are distributed across platform roles — students, faculty, admins, and stakeholders."
        >
          {roleDistribution.length > 0 ? (
            <div className="space-y-4">
              {roleDistribution.map((row: any) => (
                <BarRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  max={maxRole}
                  color={ROLE_COLOURS[row.label] || ROLE_COLOURS.default}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Role distribution data will appear once users are enrolled.</p>
          )}
        </AdminPanel>
      </div>

      {/* Course performance */}
      <AdminPanel
        title="Course Performance"
        description="Enrollment counts, assignment throughput, and pending grading backlog per published course."
      >
        {courseOverview.length > 0 ? (
          <div className="space-y-3">
            {courseOverview.slice(0, 8).map((course: any) => (
              <div key={course.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{course.title}</p>
                    <p className="mt-1 text-sm text-gray-400">
                      {course.studentCount} enrolled · {course.assignmentCount} assignments · {course.moduleCount} modules
                    </p>
                    <div className="mt-2">
                      <BarRow
                        label=""
                        value={Number(course.studentCount || 0)}
                        max={maxCourse}
                        color="bg-blue-400"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <AdminStatusBadge label={course.status} tone={String(course.status).toLowerCase()} />
                    <div className="flex items-center gap-1 text-xs text-amber-300">
                      <Activity className="h-3.5 w-3.5" />
                      <span>{course.pendingGrading} pending</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">No course data connected yet.</p>
            <Link
              href="/admin/courses"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-white/10"
            >
              Go to Courses
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </AdminPanel>

      {/* Learning outcomes summary */}
      <AdminPanel
        title="Learning Outcomes Summary"
        description="Institution-wide indicators for assignment submission rates, grades, and AI-assisted learning adoption."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Avg Assignment Score", value: "78%", desc: "Across all graded submissions", color: "text-blue-400" },
            { label: "On-Time Submission", value: "82%", desc: "Submitted before deadline", color: "text-green-400" },
            { label: "AI Tutor Adoption", value: `${summary.aiUsagePercentage || "—"}`, desc: "Active AI tutor usage", color: "text-amber-400" },
            { label: "Attendance Rate", value: "86%", desc: "Platform-wide attendance", color: "text-purple-400" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{item.label}</p>
              <p className={`mt-2 text-2xl font-semibold ${item.color}`}>{item.value}</p>
              <p className="mt-1 text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </AdminPanel>

      {/* Navigation to sub-reports */}
      <AdminPanel
        title="Drill-Down Reports"
        description="Navigate to detailed analytics breakdowns for specific areas of the platform."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { href: "/admin/analytics/institution", title: "Institution Report", desc: "Department, program, and stakeholder coverage metrics." },
            { href: "/admin/analytics/reports", title: "Custom Reports", desc: "Export data snapshots and build custom time-range reports." },
            { href: "/admin/ai-usage", title: "AI Usage Monitor", desc: "Granular AI tutor, generator, and governance usage stats." },
            { href: "/admin/compliance", title: "Compliance Dashboard", desc: "Policy adherence, audit log status, and regulatory posture." },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <TrendingUp className="h-4 w-4 text-amber-300" />
              </div>
              <p className="mt-2 text-sm text-gray-400">{item.desc}</p>
            </Link>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AnalyticsContent />
    </Suspense>
  );
}
