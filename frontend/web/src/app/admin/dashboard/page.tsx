"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  GraduationCap,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCog,
  Users,
  Zap,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdminSummary {
  totalUsers: number;
  activeUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalFaculty: number;
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

interface AdminRecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  created_at?: string | null;
}

interface StudentProgress {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  avgProgress: number;
  avgMastery: number;
  lastActive?: string | null;
  coursesEnrolled: number;
  status: "at-risk" | "needs-attention" | "on-track";
}

interface QueueHealth {
  total_pending: number;
  total_verified: number;
  avg_verification_time?: string;
  backlog_trend?: string;
}

interface GuardianSignal {
  id: string;
  signal_type?: string;
  severity?: string;
  description?: string;
  created_at?: string;
}

interface SystemHealth {
  api_latency?: string;
  cache_hit_rate?: string;
  services?: Array<{ name: string; status: string; uptime: string }>;
}

const EMPTY_SUMMARY: AdminSummary = {
  totalUsers: 0,
  activeUsers: 0,
  totalStudents: 0,
  totalTeachers: 0,
  totalFaculty: 0,
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgo(value?: string | null) {
  if (!value) return "Never";
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours > 0) return `${hours}h ago`;
  return "Recently";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
          {subtitle && <p className="mt-1 text-sm text-gray-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  color = "gold",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof Users;
  trend?: "up" | "down" | "neutral";
  color?: "gold" | "red" | "green" | "blue";
}) {
  const colorMap = {
    gold: "from-lumina-highlight/15 to-lumina-highlight/5 border-lumina-highlight/20 text-lumina-highlight",
    red: "from-red-500/15 to-red-500/5 border-red-400/20 text-red-400",
    green: "from-yellow-500/15 to-yellow-500/5 border-yellow-400/20 text-yellow-300",
    blue: "from-blue-500/15 to-blue-500/5 border-blue-400/20 text-blue-400",
  };
  return (
    <div className={cn("rounded-3xl border bg-gradient-to-br p-5", colorMap[color])}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">{label}</p>
        <div className="rounded-xl bg-black/20 p-2">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-display font-bold text-white">{value}</p>
      {sub && (
        <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-400">
          {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-yellow-400" />}
          {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
          <span>{sub}</span>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, detail }: { icon: typeof Users; title: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-400">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">{detail}</p>
    </div>
  );
}

// ─── Alert Bar ────────────────────────────────────────────────────────────────

function AlertBar({
  attentionQueue,
  guardianSignals,
  atRiskCount,
}: {
  attentionQueue: AdminAttentionItem[];
  guardianSignals: GuardianSignal[];
  atRiskCount: number;
}) {
  const highAlerts = attentionQueue.filter((i) => i.severity === "high");
  const guardianFlags = guardianSignals.length;
  const total = highAlerts.length + (atRiskCount > 0 ? 1 : 0) + (guardianFlags > 0 ? 1 : 0);

  if (total === 0) return null;

  return (
    <div className="rounded-2xl border border-red-400/20 bg-red-500/5 px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
          <span className="text-sm font-bold text-red-300 uppercase tracking-[0.2em]">
            {total} Active Alert{total !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {highAlerts.slice(0, 3).map((a) => (
            <Link
              key={a.id}
              href={a.href}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-medium text-red-300 transition-colors hover:bg-red-400/20"
            >
              <AlertTriangle className="h-3 w-3" />
              {a.title}
            </Link>
          ))}
          {atRiskCount > 0 && (
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-400/20"
            >
              <TrendingDown className="h-3 w-3" />
              {atRiskCount} student{atRiskCount !== 1 ? "s" : ""} at risk
            </Link>
          )}
          {guardianFlags > 0 && (
            <Link
              href="/admin/security"
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-medium text-red-300 transition-colors hover:bg-red-400/20"
            >
              <Shield className="h-3 w-3" />
              {guardianFlags} AI flag{guardianFlags !== 1 ? "s" : ""}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AI Monitoring Panel ──────────────────────────────────────────────────────

function AiMonitoringPanel({
  queueHealth,
  guardianSignals,
}: {
  queueHealth: QueueHealth;
  guardianSignals: GuardianSignal[];
}) {
  const pending = queueHealth.total_pending ?? 0;
  const verified = queueHealth.total_verified ?? 0;
  const flagged = guardianSignals.length;
  const total = pending + verified;
  const verifyRate = total > 0 ? Math.round((verified / total) * 100) : 0;

  return (
    <Panel
      title="AI Monitoring"
      subtitle="Verification queue throughput and Guardian safety signals."
      action={
        <Link
          href="/admin/system"
          className="inline-flex items-center gap-2 text-sm font-semibold text-lumina-highlight transition-colors hover:text-white"
        >
          View system
          <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <p className="text-2xl font-bold text-lumina-highlight">{pending}</p>
          <p className="mt-1 text-xs text-gray-400 uppercase tracking-[0.2em]">Pending</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <p className="text-2xl font-bold text-yellow-300">{verified}</p>
          <p className="mt-1 text-xs text-gray-400 uppercase tracking-[0.2em]">Verified</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <p className="text-2xl font-bold text-white">{verifyRate}%</p>
          <p className="mt-1 text-xs text-gray-400 uppercase tracking-[0.2em]">Rate</p>
        </div>
        <div
          className={cn(
            "rounded-2xl border p-4 text-center",
            flagged > 0 ? "border-red-400/20 bg-red-400/5" : "border-white/10 bg-white/[0.03]",
          )}
        >
          <p className={cn("text-2xl font-bold", flagged > 0 ? "text-red-400" : "text-white")}>{flagged}</p>
          <p className="mt-1 text-xs text-gray-400 uppercase tracking-[0.2em]">Flagged</p>
        </div>
      </div>

      {queueHealth.avg_verification_time && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <Clock className="h-4 w-4 text-lumina-highlight" />
          <p className="text-sm text-gray-300">
            Avg verification time:{" "}
            <span className="font-semibold text-white">{queueHealth.avg_verification_time}</span>
          </p>
          {queueHealth.backlog_trend && (
            <span
              className={cn(
                "ml-auto rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em]",
                queueHealth.backlog_trend === "decreasing"
                  ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                  : "border-red-400/20 bg-red-400/10 text-red-300",
              )}
            >
              {queueHealth.backlog_trend}
            </span>
          )}
        </div>
      )}

      {flagged > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Recent Guardian Flags</p>
          {guardianSignals.slice(0, 3).map((sig) => (
            <div
              key={sig.id}
              className="flex items-start gap-3 rounded-2xl border border-red-400/10 bg-red-500/5 p-3"
            >
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">
                  {sig.signal_type || sig.description || "Flagged content"}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">{formatDateTime(sig.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

// ─── Student Risk Panel ───────────────────────────────────────────────────────

function StudentRiskPanel({ students }: { students: StudentProgress[] }) {
  const atRisk = students.filter((s) => s.status === "at-risk" || s.status === "needs-attention");

  return (
    <Panel
      title="Student Risk Radar"
      subtitle="Students with low mastery or extended inactivity."
      action={
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm font-semibold text-lumina-highlight transition-colors hover:text-white"
        >
          All students
          <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      {atRisk.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All students on track"
          detail="No students currently flagged as at-risk."
        />
      ) : (
        <div className="space-y-3">
          {atRisk.slice(0, 6).map((student) => {
            const isHigh = student.status === "at-risk";
            return (
              <div
                key={student.id}
                className={cn(
                  "rounded-2xl border p-4",
                  isHigh
                    ? "border-red-400/15 bg-red-500/5"
                    : "border-amber-400/15 bg-amber-400/5",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-bold",
                        isHigh ? "bg-red-500/20 text-red-300" : "bg-amber-400/20 text-amber-300",
                      )}
                    >
                      {student.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{student.name}</p>
                      <p className="text-xs text-gray-400">{student.email}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em]",
                      isHigh
                        ? "border-red-400/20 bg-red-400/10 text-red-300"
                        : "border-amber-400/20 bg-amber-400/10 text-amber-300",
                    )}
                  >
                    {isHigh ? "At Risk" : "Watch"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-white/10 bg-black/10 py-2">
                    <p className="font-semibold text-white">{student.avgMastery}%</p>
                    <p className="text-gray-500">Mastery</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/10 py-2">
                    <p className="font-semibold text-white">{student.avgProgress}%</p>
                    <p className="text-gray-500">Progress</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/10 py-2">
                    <p className="font-semibold text-white">{timeAgo(student.lastActive)}</p>
                    <p className="text-gray-500">Last seen</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

// ─── System Health Panel ──────────────────────────────────────────────────────

function SystemHealthPanel({ health }: { health: SystemHealth }) {
  const services = health.services ?? [];

  return (
    <Panel title="System Health" subtitle="Core infrastructure posture and service uptime.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {health.api_latency && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
            <p className="text-lg font-bold text-yellow-300">{health.api_latency}</p>
            <p className="mt-0.5 text-xs text-gray-500 uppercase tracking-[0.15em]">API Latency</p>
          </div>
        )}
        {health.cache_hit_rate && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
            <p className="text-lg font-bold text-yellow-300">{health.cache_hit_rate}</p>
            <p className="mt-0.5 text-xs text-gray-500 uppercase tracking-[0.15em]">Cache Hit</p>
          </div>
        )}
      </div>

      {services.length > 0 && (
        <div className="mt-4 space-y-2">
          {services.map((svc) => (
            <div
              key={svc.name}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 px-4 py-3"
            >
              <p className="text-sm text-white">{svc.name}</p>
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-500">{svc.uptime}</p>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]",
                    svc.status === "operational"
                      ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                      : "border-red-400/20 bg-red-400/10 text-red-300",
                  )}
                >
                  {svc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [dashData, setDashData] = useState<any>(null);
  const [queueHealth, setQueueHealth] = useState<QueueHealth>({} as QueueHealth);
  const [guardianSignals, setGuardianSignals] = useState<GuardianSignal[]>([]);
  const [studentsProgress, setStudentsProgress] = useState<StudentProgress[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = useCallback(async () => {
    try {
      const [dash, queue, guardian, students, sysHealth] = await Promise.allSettled([
        api.getDashboardData("admin"),
        api.getAdminQueueHealth(),
        api.getAdminGuardianSignals(),
        api.getAdminStudentsProgress(),
        api.getAdminSystemHealth(),
      ]);

      if (dash.status === "fulfilled") setDashData(dash.value);
      else throw new Error("Dashboard data unavailable");

      if (queue.status === "fulfilled") setQueueHealth(queue.value);
      if (guardian.status === "fulfilled") setGuardianSignals(guardian.value);
      if (students.status === "fulfilled") setStudentsProgress(students.value);
      if (sysHealth.status === "fulfilled") setSystemHealth(sysHealth.value);

      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err?.message || "Unable to load admin dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-lumina-highlight" />
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

  const summary: AdminSummary = { ...EMPTY_SUMMARY, ...(dashData?.summary || {}) };
  const attentionQueue: AdminAttentionItem[] = dashData?.attentionQueue || [];
  const recentUsers: AdminRecentUser[] = dashData?.recentUsers || [];
  const atRiskStudents = studentsProgress.filter(
    (s) => s.status === "at-risk" || s.status === "needs-attention",
  );

  return (
    <div className="space-y-6">
      {/* Alert Bar */}
      <AlertBar
        attentionQueue={attentionQueue}
        guardianSignals={guardianSignals}
        atRiskCount={atRiskStudents.length}
      />

      {/* Hero */}
      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">
                Lumina Control Center
              </p>
              <h1 className="text-3xl font-display font-bold text-white md:text-5xl">
                Intelligence{" "}
                <span className="text-lumina-highlight border-b-4 border-lumina-highlight/30">
                  operations
                </span>{" "}
                dashboard.
              </h1>
              <p className="mt-3 text-sm text-gray-400 leading-relaxed max-w-2xl">
                Real-time student intelligence, AI verification health, risk signals, and platform posture —
                unified into one operational view.
              </p>
            </div>
            <button
              onClick={() => { setLoading(true); load(); }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuickLink href="/admin/users" icon={UserCog} label="Manage Users" />
            <QuickLink href="/admin/security" icon={Shield} label="Security" />
            <QuickLink href="/admin/system" icon={Zap} label="AI System" />
            <QuickLink href="/admin/institution" icon={Brain} label="Institution" />
          </div>

          <p className="mt-4 text-xs text-gray-600">
            Last refreshed: {lastRefresh.toLocaleTimeString()} · Auto-refreshes every 60 seconds
          </p>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Students"
          value={summary.totalStudents}
          sub={`${summary.activeUsers} active accounts`}
          icon={GraduationCap}
          color="gold"
        />
        <KpiCard
          label="Faculty & HODs"
          value={summary.totalFaculty || summary.totalTeachers}
          sub="Instructional staff"
          icon={Users}
          color="gold"
        />
        <KpiCard
          label="Active Users"
          value={summary.activeUsers}
          sub={`${summary.totalUsers} total accounts`}
          icon={Bot}
          color={summary.activeUsers < summary.totalUsers ? "gold" : "green"}
          trend={summary.activeUsers < summary.totalUsers ? "down" : "up"}
        />
        <KpiCard
          label="At-Risk Students"
          value={atRiskStudents.length}
          sub="Need intervention"
          icon={TrendingDown}
          color={atRiskStudents.length > 0 ? "red" : "green"}
        />
        <KpiCard
          label="Published Courses"
          value={summary.activeCourses}
          sub={`${summary.draftCourses} in draft`}
          icon={BookOpen}
          color="gold"
        />
      </div>

      {/* Attention Queue + AI Monitoring */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Attention Queue"
          subtitle="High-signal issues requiring immediate escalation."
          action={
            <Link
              href="/admin/security"
              className="inline-flex items-center gap-2 text-sm font-semibold text-lumina-highlight transition-colors hover:text-white"
            >
              Security
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {attentionQueue.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No critical items"
              detail="The platform has no escalation-ready access or operational issues."
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
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]",
                      item.severity === "high"
                        ? "border-red-400/20 bg-red-400/10 text-red-300"
                        : "border-amber-400/20 bg-amber-400/10 text-amber-300",
                    )}
                  >
                    {item.severity}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <AiMonitoringPanel queueHealth={queueHealth} guardianSignals={guardianSignals} />
      </div>

      {/* Student Risk + System Health */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <StudentRiskPanel students={studentsProgress} />
        <SystemHealthPanel health={systemHealth} />
      </div>

      {/* Recent Users + Activity */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Recent Users"
          subtitle="Newest accounts entering the platform."
          action={
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 text-sm font-semibold text-lumina-highlight transition-colors hover:text-white"
            >
              All users
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {recentUsers.length === 0 ? (
            <EmptyState icon={Users} title="No recent users" detail="New accounts will appear here." />
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
                      <p className="truncate text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-lumina-highlight capitalize">{user.role}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(user.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Platform Activity" subtitle="Recent operations across onboarding and relationships.">
          {(dashData?.activityFeed || []).length === 0 ? (
            <EmptyState icon={Activity} title="No recent activity" detail="Platform events will appear here." />
          ) : (
            <div className="space-y-3">
              {(dashData.activityFeed as any[]).slice(0, 8).map((item: any) => (
                <Link
                  key={item.id}
                  href={item.href || "#"}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div
                    className={cn(
                      "rounded-xl p-2",
                      item.tone === "success"
                        ? "bg-yellow-400/10 text-yellow-300"
                        : "bg-lumina-highlight/10 text-lumina-highlight",
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
                    <p className="mt-1 text-xs text-gray-500">{formatDateTime(item.timestamp)}</p>
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

// ─── QuickLink ────────────────────────────────────────────────────────────────

function QuickLink({ href, icon: Icon, label }: { href: string; icon: typeof UserCog; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition-all hover:border-lumina-highlight/30 hover:bg-lumina-highlight/10 hover:text-lumina-highlight"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
