"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Network,
  Shield,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/StatCard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AdminSummary {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  activeCourses: number;
  draftCourses: number;
  totalInstitutions: number;
  totalConnections: number;
  systemHealthScore: number;
  systemHealthLabel: string;
  securityAlerts: number;
  attentionRequired: number;
}

interface AdminAttentionItem {
  id: string;
  severity: "high" | "medium";
  title: string;
  detail: string;
  href: string;
}

interface AdminService {
  name: string;
  status: "healthy" | "watch" | "degraded";
  metric: string;
  detail: string;
}

interface AdminInstitution {
  id: string;
  institution_name: string;
  institution_type?: string;
  city?: string;
  state?: string;
  onboarding_status?: string;
  departmentCount: number;
  programCount: number;
  stakeholderCount: number;
  health: "connected" | "new";
}

interface AdminConnection {
  id: string;
  userName?: string;
  userEmail?: string;
  userRole?: string | null;
  institutionName?: string | null;
  programName?: string | null;
  category: string;
  created_at?: string | null;
}

interface AdminRecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar: string;
  created_at?: string | null;
}

interface AdminActivityItem {
  id: string;
  timestamp?: string | null;
  title: string;
  detail: string;
  tone: "info" | "success";
  href: string;
}

interface AdminDashboardData {
  summary?: Partial<AdminSummary>;
  attentionQueue?: AdminAttentionItem[];
  systemServices?: AdminService[];
  institutions?: AdminInstitution[];
  connections?: AdminConnection[];
  recentUsers?: AdminRecentUser[];
  activityFeed?: AdminActivityItem[];
}

const EMPTY_SUMMARY: AdminSummary = {
  totalUsers: 0,
  totalStudents: 0,
  totalTeachers: 0,
  totalCourses: 0,
  activeCourses: 0,
  draftCourses: 0,
  totalInstitutions: 0,
  totalConnections: 0,
  systemHealthScore: 100,
  systemHealthLabel: "100%",
  securityAlerts: 0,
  attentionRequired: 0,
};

function formatDateTime(value?: string | null) {
  if (!value) return "No timestamp";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No timestamp";
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("glass-v2 border-white/5 overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-4 border-b border-white/5 p-6">
        <div>
          <h2 className="text-xl font-display font-bold text-white">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-gray-400">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await api.getDashboardData("admin");
        setData(payload);
      } catch (err: any) {
        console.error("admin_dashboard_load_failed", err);
        setError(err?.message || "Unable to load admin dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-amber-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-v2 border border-red-400/20 p-8 text-center">
        <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-red-400" />
        <h1 className="text-xl font-semibold text-white">Admin control center unavailable</h1>
        <p className="mt-2 text-sm text-gray-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          Try Again
        </button>
      </div>
    );
  }

  const summary = { ...EMPTY_SUMMARY, ...(data?.summary || {}) };
  const attentionQueue = data?.attentionQueue || [];
  const systemServices = data?.systemServices || [];
  const institutions = data?.institutions || [];
  const connections = data?.connections || [];
  const recentUsers = data?.recentUsers || [];
  const activityFeed = data?.activityFeed || [];

  return (
    <div className="space-y-8">
      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="grid gap-6 p-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)]">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">
              Admin Control Center
            </p>
            <h1 className="max-w-3xl text-4xl font-display font-bold tracking-tight text-white md:text-6xl">
              Govern the platform with <span className="text-lumina-highlight border-b-4 border-lumina-highlight/30">live operational context.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-gray-400 leading-relaxed">
              Users, institutions, access risk, and delivery throughput are now
              connected into one dashboard instead of isolated placeholder pages.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <DashboardLink
                href="/admin/users"
                icon={UserCog}
                title="Manage users"
                description="Create accounts, adjust roles, and clean up dormant access."
                tone="gold"
              />
              <DashboardLink
                href="/admin/institution"
                icon={Building2}
                title="Manage institutions"
                description="Connect stakeholders, departments, and onboarding flows."
                tone="gold"
              />
              <DashboardLink
                href="/admin/security"
                icon={Shield}
                title="Review security"
                description="Audit suspended accounts, elevated access, and system signals."
                tone="gold"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">System health</p>
                <p className="mt-2 text-4xl font-display font-bold text-white">
                  {summary.systemHealthLabel}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-2xl border px-4 py-2 text-sm font-semibold",
                  summary.securityAlerts > 0
                    ? "border-lumina-highlight/20 bg-lumina-highlight/10 text-lumina-highlight"
                    : "border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
                )}
              >
                {summary.securityAlerts > 0
                  ? `${summary.securityAlerts} alert(s)`
                  : "Secure"}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <SignalRow
                icon={Users}
                label="Accounts monitored"
                value={summary.totalUsers}
              />
              <SignalRow
                icon={Network}
                label="Institution links"
                value={summary.totalConnections}
              />
              <SignalRow
                icon={BookOpen}
                label="Published courses"
                value={summary.activeCourses}
              />
              <SignalRow
                icon={AlertTriangle}
                label="Attention items"
                value={summary.attentionRequired}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={summary.totalUsers}
          subtitle={`${summary.totalStudents} students / ${summary.totalTeachers} teachers`}
          icon={Users}
          color="gold"
        />
        <StatCard
          title="Course Catalog"
          value={summary.totalCourses}
          subtitle={`${summary.activeCourses} active / ${summary.draftCourses} draft`}
          icon={BookOpen}
          color="gold"
        />
        <StatCard
          title="Primary Institution"
          value={summary.totalInstitutions}
          subtitle={`${summary.totalConnections} stakeholder connections`}
          icon={Building2}
          color="gold"
        />
        <StatCard
          title="Security"
          value={summary.securityAlerts === 0 ? "Secure" : summary.securityAlerts}
          subtitle={`${summary.attentionRequired} operational issue(s)`}
          icon={Shield}
          color="gold"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <Panel
          title="Attention Queue"
          subtitle="High-signal issues across grading, access, staffing, and onboarding."
          action={
            <Link
              href="/admin/security"
              className="inline-flex items-center gap-2 text-sm font-semibold text-lumina-highlight transition-colors hover:text-white"
            >
              Open security
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {attentionQueue.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No critical queue items"
              detail="The platform does not currently report access or operational issues needing escalation."
            />
          ) : (
            <div className="space-y-3">
              {attentionQueue.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div
                    className={cn(
                      "rounded-xl p-2",
                      item.severity === "high"
                        ? "bg-red-500/10 text-red-300"
                        : "bg-amber-400/10 text-amber-300",
                    )}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-400">{item.detail}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Platform Services" subtitle="Core operating areas and current posture.">
          <div className="space-y-3">
            {systemServices.map((service) => (
              <div
                key={service.name}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{service.name}</p>
                    <p className="mt-1 text-sm text-gray-400">{service.detail}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                      service.status === "healthy"
                        ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                        : service.status === "watch"
                          ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                          : "border-red-400/20 bg-red-400/10 text-red-300",
                    )}
                  >
                    {service.status}
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium text-amber-200">{service.metric}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Panel
          title="Institutional Core"
          subtitle="Governing the primary organization tenant and integrated stakeholders."
          action={
            <Link
              href="/admin/institution"
              className="inline-flex items-center gap-2 text-sm font-semibold text-lumina-highlight transition-colors hover:text-white"
            >
              Management
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {institutions.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No primary institution onboarded"
              detail="Define the primary institution to establish the administrative core."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {institutions.slice(0, 1).map((institution) => (
                <div
                  key={institution.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                        {institution.institution_type || "Institution"}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">
                        {institution.institution_name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-400">
                        {[institution.city, institution.state].filter(Boolean).join(", ") || "Location pending"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                        institution.health === "connected"
                          ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                          : "border-amber-400/20 bg-amber-400/10 text-amber-300",
                      )}
                    >
                      {institution.health}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                    <Metric label="Departments" value={institution.departmentCount} />
                    <Metric label="Programs" value={institution.programCount} />
                    <Metric label="Stakeholders" value={institution.stakeholderCount} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Latest Connections"
          subtitle="Recent stakeholder links across institutions and programs."
        >
          {connections.length === 0 ? (
            <EmptyState
              icon={Network}
              title="No live connections yet"
              detail="Stakeholder relationships will appear here once institutions are linked to users."
            />
          ) : (
            <div className="space-y-3">
              {connections.slice(0, 6).map((connection) => (
                <div
                  key={connection.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">
                        {connection.userName || "Unassigned user"}
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        {connection.userEmail || "No email"} • {connection.userRole || connection.category}
                      </p>
                    </div>
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                      {connection.category}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-300">
                    {connection.institutionName || "Institution"}{connection.programName ? ` • ${connection.programName}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Linked {formatDateTime(connection.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Panel
          title="Recent Users"
          subtitle="Newest accounts entering the platform."
          action={
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 text-sm font-semibold text-lumina-highlight transition-colors hover:text-white"
            >
              Open users
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {recentUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No recent users"
              detail="New account creation will appear here."
            />
          ) : (
            <div className="space-y-3">
              {recentUsers.slice(0, 6).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-10 w-10 rounded-2xl border border-white/10 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white">
                        {user.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{user.name}</p>
                      <p className="truncate text-sm text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{user.role}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(user.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Activity Feed" subtitle="Recent operations across onboarding and relationships.">
          {activityFeed.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No recent activity"
              detail="Platform events will show up here once operations start flowing."
            />
          ) : (
            <div className="space-y-3">
              {activityFeed.slice(0, 8).map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div
                    className={cn(
                      "rounded-xl p-2",
                      item.tone === "success"
                        ? "bg-yellow-400/10 text-yellow-300"
                        : "bg-amber-400/10 text-amber-300",
                    )}
                  >
                    {item.tone === "success" ? (
                      <Sparkles className="h-4 w-4" />
                    ) : (
                      <Activity className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-400">{item.detail}</p>
                    <p className="mt-2 text-xs text-gray-500">{formatDateTime(item.timestamp)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function DashboardLink({
  href,
  icon: Icon,
  title,
  description,
  tone,
}: {
  href: string;
  icon: typeof UserCog;
  title: string;
  description: string;
  tone: "amber" | "yellow" | "gold";
}) {
  const toneStyles = {
    amber: "from-amber-500/20 to-amber-500/5 border-amber-400/20 text-amber-200",
    yellow: "from-yellow-500/20 to-yellow-500/5 border-yellow-400/20 text-yellow-200",
    gold: "from-lumina-highlight/20 to-lumina-highlight/5 border-lumina-highlight/20 text-lumina-highlight",
  };

  return (
    <Link
      href={href}
      className={cn(
        "group rounded-2xl border bg-gradient-to-br p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20",
        toneStyles[tone],
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm text-gray-300/80">{description}</p>
        </div>
        <div className="rounded-xl bg-black/20 p-3 text-white/80 transition-transform group-hover:scale-105">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}

function SignalRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-white/5 p-2 text-lumina-highlight">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-sm text-white">{label}</p>
      </div>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Users;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-400">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">{detail}</p>
    </div>
  );
}
