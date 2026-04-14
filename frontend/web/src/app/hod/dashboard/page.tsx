"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  CheckCircle,
  XCircle,
  Brain,
  BarChart3,
  Timer,
  Zap,
  Bell,
  Star,
  AlertOctagon,
  Clock,
  Activity,
  Target,
  Network,
  ChevronRight,
  MessageSquare,
  CalendarCheck,
  Shield,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/StatCard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface DepartmentInfo {
  id: string;
  department_name: string;
  code: string;
}

interface HODSummary {
  totalTeachers: number;
  totalStudents: number;
  totalPrograms: number;
  pendingRequests: number;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
  level: string;
}

interface TeacherRequest {
  id: string;
  teacher_name: string;
  program_name: string;
  semester_number: number;
  course_name: string;
  status: string;
}

interface HODDashboardData {
  department: DepartmentInfo;
  summary: HODSummary;
  teachers: Teacher[];
  programs: Program[];
  requests: TeacherRequest[];
}

// ─── Static intelligence data (represents processed AI analytics) ─────────────

const KNOWLEDGE_GRAPH_DATA = [
  { topic: "Thermodynamics", weakAcross: 3, avgMastery: 41, type: "curriculum" },
  { topic: "Operating Systems", weakAcross: 2, avgMastery: 53, type: "curriculum" },
  { topic: "Data Structures", weakAcross: 1, avgMastery: 67, type: "faculty" },
  { topic: "Database Design", weakAcross: 2, avgMastery: 58, type: "curriculum" },
  { topic: "Linear Algebra", weakAcross: 3, avgMastery: 44, type: "curriculum" },
  { topic: "Computer Networks", weakAcross: 1, avgMastery: 72, type: "student" },
];

const FACULTY_PERFORMANCE_DATA = [
  { name: "Dr. Meera Nair", avgVerifyHrs: 1.2, gradingSpeed: 94, satisfaction: 4.7, syllabusComplete: 88, load: 4, status: "excellent" },
  { name: "Prof. Arjun Das", avgVerifyHrs: 3.8, gradingSpeed: 72, satisfaction: 3.9, syllabusComplete: 71, load: 5, status: "watch" },
  { name: "Dr. Priya Rao", avgVerifyHrs: 0.9, gradingSpeed: 98, satisfaction: 4.9, syllabusComplete: 95, load: 3, status: "excellent" },
  { name: "Mr. Kiran Babu", avgVerifyHrs: 6.2, gradingSpeed: 55, satisfaction: 3.4, syllabusComplete: 62, load: 5, status: "critical" },
];

const SYLLABUS_DATA = [
  { subject: "Data Structures", faculty: "Dr. Meera Nair", covered: 88, total: 100, daysLeft: 22, status: "on-track" },
  { subject: "Thermodynamics", faculty: "Prof. Arjun Das", covered: 61, total: 100, daysLeft: 18, status: "delay" },
  { subject: "Operating Systems", faculty: "Dr. Priya Rao", covered: 95, total: 100, daysLeft: 22, status: "on-track" },
  { subject: "Database Design", faculty: "Mr. Kiran Babu", covered: 47, total: 100, daysLeft: 20, status: "critical" },
  { subject: "Computer Networks", faculty: "Dr. Meera Nair", covered: 80, total: 100, daysLeft: 22, status: "on-track" },
];

const SLA_DATA = [
  { faculty: "Mr. Kiran Babu", pendingAnswers: 14, avgWaitHrs: 8.2, slaBreached: true },
  { faculty: "Prof. Arjun Das", pendingAnswers: 6, avgWaitHrs: 4.1, slaBreached: true },
  { faculty: "Dr. Meera Nair", pendingAnswers: 1, avgWaitHrs: 1.2, slaBreached: false },
  { faculty: "Dr. Priya Rao", pendingAnswers: 0, avgWaitHrs: 0.8, slaBreached: false },
];

const AT_RISK_DATA = [
  { name: "Rohit Kumar", subjects: 4, mastery: 31, lastActive: "3 days ago", risk: "critical" },
  { name: "Sneha Pillai", subjects: 3, mastery: 42, lastActive: "1 day ago", risk: "high" },
  { name: "Vikram Singh", subjects: 2, mastery: 50, lastActive: "Today", risk: "medium" },
  { name: "Aditi Sharma", subjects: 2, mastery: 55, lastActive: "2 days ago", risk: "medium" },
];

const ALUMNI_FEEDBACK = [
  { topic: "Operating Systems", relevanceScore: 38, industry: "Cloud & DevOps", feedback: "Too theory-heavy, less practical focus" },
  { topic: "Machine Learning", relevanceScore: 91, industry: "Data & AI", feedback: "Highly relevant, needs more hands-on labs" },
  { topic: "Thermodynamics", relevanceScore: 44, industry: "Core Engineering", feedback: "Adequate but outdated case studies" },
  { topic: "Web Technologies", relevanceScore: 87, industry: "Product & SaaS", feedback: "Very useful, recommend adding TypeScript" },
];

const ALERTS_DATA = [
  { id: "a1", type: "critical", title: "SLA Breach", desc: "Mr. Kiran Babu has 14 unanswered student questions (avg 8.2 hrs wait)", time: "10 min ago" },
  { id: "a2", type: "warning", title: "Syllabus Delay", desc: "Database Design is 53% behind pace with 20 days remaining", time: "1 hr ago" },
  { id: "a3", type: "warning", title: "At-Risk Cluster", desc: "Rohit Kumar is failing in 4 subjects — counselor escalation recommended", time: "2 hrs ago" },
  { id: "a4", type: "info", title: "Knowledge Pattern", desc: "Thermodynamics mastery below 45% across 3 classes — possible curriculum gap", time: "4 hrs ago" },
  { id: "a5", type: "info", title: "Faculty Review Due", desc: "Monthly performance review pending for Prof. Arjun Das", time: "Yesterday" },
];

// ─── Components ──────────────────────────────────────────────────────────────

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

function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 text-xs font-bold text-lumina-highlight hover:text-lumina-highlight/80 transition-colors"
    >
      {label} <ChevronRight className="h-3 w-3" />
    </Link>
  );
}

function EmptyState({
  icon: Icon,
  title,
  detail,
  compact = false,
}: {
  icon: any;
  title: string;
  detail: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "py-4" : "py-12")}>
      <div className="rounded-full bg-white/5 p-4 text-gray-400">
        <Icon className={cn(compact ? "h-6 w-6" : "h-10 w-10")} />
      </div>
      <h3 className={cn("mt-4 font-semibold text-white", compact ? "text-sm" : "text-lg")}>{title}</h3>
      <p className={cn("mt-2 text-gray-400 max-w-sm mx-auto", compact ? "text-xs" : "text-sm")}>{detail}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "on-track": "bg-green-500/10 text-green-400 border-green-500/20",
    delay: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    critical: "bg-red-500/10 text-red-400 border-red-500/20",
    excellent: "bg-green-500/10 text-green-400 border-green-500/20",
    watch: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    high: "bg-red-500/10 text-red-400 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    low: "bg-green-500/10 text-green-400 border-green-500/20",
  };
  const labels: Record<string, string> = {
    "on-track": "🟢 On Track",
    delay: "🟡 Slight Delay",
    critical: "🔴 Critical",
    excellent: "Excellent",
    watch: "Watch",
    high: "High Risk",
    medium: "Medium Risk",
    low: "Low Risk",
  };
  return (
    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", styles[status] || "bg-white/5 text-gray-400 border-white/10")}>
      {labels[status] || status}
    </span>
  );
}

function ProgressBar({ value, color = "gold" }: { value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    gold: "bg-lumina-highlight",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };
  const barColor = value >= 75 ? colorMap.green : value >= 50 ? colorMap.yellow : colorMap.red;
  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${value}%` }} />
    </div>
  );
}

export default function HODDashboard() {
  const [data, setData] = useState<HODDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const load = async () => {
    try {
      const payload = await api.getHODDashboard();
      setData(payload);
    } catch (err: any) {
      console.error("hod_dashboard_load_failed", err);
      setError(err?.message || "Unable to load HOD dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRequestAction = async (requestId: string, approve: boolean) => {
    setProcessingRequestId(requestId);
    try {
      if (approve) {
        await api.approveTeacherRequest(requestId);
      } else {
        await api.rejectTeacherRequest(requestId);
      }
      await load();
    } catch (err: any) {
      console.error("request_action_failed", err);
      alert(err?.message || "Action failed");
    } finally {
      setProcessingRequestId(null);
    }
  };

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
        <h1 className="text-xl font-semibold text-white">HOD dashboard unavailable</h1>
        <p className="mt-2 text-sm text-gray-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const slaBreachCount = SLA_DATA.filter((s) => s.slaBreached).length;
  const atRiskCount = AT_RISK_DATA.length;
  const avgMastery = 64;
  const passRatePrediction = 78;
  const syllabusAvg = Math.round(SYLLABUS_DATA.reduce((a, s) => a + s.covered, 0) / SYLLABUS_DATA.length);

  return (
    <div className="space-y-8">

      {/* ── Hero Header ─────────────────────────────────────────────────────── */}
      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="rounded-2xl bg-lumina-highlight/10 p-4 border border-lumina-highlight/20 text-lumina-highlight">
              <Building className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">
                Academic Intelligence Command Center
              </p>
              <h1 className="text-3xl font-display font-bold text-white">
                {data.department.department_name} ({data.department.code})
              </h1>
            </div>
          </div>
          <p className="max-w-3xl text-lg text-gray-400 leading-relaxed">
            Real-time academic health across all faculty and students. Detect patterns, monitor compliance, and act before exams.
          </p>
          {/* Quick Alert Strip */}
          {slaBreachCount > 0 && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-3">
              <AlertOctagon className="h-5 w-5 shrink-0 text-red-400" />
              <p className="text-sm text-red-300">
                <span className="font-bold">{slaBreachCount} SLA breach{slaBreachCount > 1 ? "es" : ""}</span> detected — students are waiting on faculty responses.
              </p>
              <Link href="/hod/sla-monitor" className="ml-auto text-xs font-bold text-red-400 hover:underline flex items-center gap-1">
                View <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Tier 1 Stat Cards (Live Academic Health) ────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pass Rate Prediction"
          value={`${passRatePrediction}%`}
          subtitle="AI forecast for current semester"
          icon={Target}
          color="gold"
          trend={{ value: "+3%", isPositive: true }}
        />
        <StatCard
          title="Avg Department Mastery"
          value={`${avgMastery}%`}
          subtitle="Across all courses & students"
          icon={Brain}
          color="gold"
          trend={{ value: "-2%", isPositive: false }}
        />
        <StatCard
          title="At-Risk Students"
          value={atRiskCount}
          subtitle="Need intervention now"
          icon={AlertOctagon}
          color="amber"
        />
        <StatCard
          title="Syllabus Completion"
          value={`${syllabusAvg}%`}
          subtitle="Average across all subjects"
          icon={ClipboardCheck}
          color="gold"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Faculty"
          value={data.summary.totalTeachers}
          subtitle="Departmental Teachers"
          icon={Users}
          color="gold"
        />
        <StatCard
          title="Students"
          value={data.summary.totalStudents}
          subtitle="Enrolled Learners"
          icon={GraduationCap}
          color="gold"
        />
        <StatCard
          title="Programs"
          value={data.summary.totalPrograms}
          subtitle="Undergraduate / Graduate"
          icon={BookOpen}
          color="gold"
        />
        <StatCard
          title="Pending Requests"
          value={data.summary.pendingRequests}
          subtitle="Teacher course assignments"
          icon={ClipboardCheck}
          color="amber"
        />
      </div>

      {/* ── Active Alerts ────────────────────────────────────────────────────── */}
      <Panel
        title="🔔 Alert Center"
        subtitle="Department-level anomalies and action items requiring HOD attention."
        action={<SectionLink href="/hod/alerts" label="All Alerts" />}
      >
        <div className="space-y-3">
          {ALERTS_DATA.slice(0, 4).map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "flex items-start gap-4 rounded-xl border p-4",
                alert.type === "critical"
                  ? "border-red-500/20 bg-red-500/5"
                  : alert.type === "warning"
                  ? "border-yellow-500/20 bg-yellow-500/5"
                  : "border-white/10 bg-white/[0.02]"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 h-8 w-8 shrink-0 rounded-lg flex items-center justify-center",
                  alert.type === "critical"
                    ? "bg-red-500/10 text-red-400"
                    : alert.type === "warning"
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "bg-white/5 text-gray-400"
                )}
              >
                {alert.type === "critical" ? (
                  <AlertOctagon className="h-4 w-4" />
                ) : alert.type === "warning" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white">{alert.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{alert.desc}</p>
              </div>
              <span className="shrink-0 text-[10px] text-gray-500">{alert.time}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* ── Cross-Faculty Knowledge Graph ───────────────────────────────────── */}
      <Panel
        title="🧠 Cross-Faculty Knowledge Graph"
        subtitle="Topics with below-average mastery aggregated across all classes. Patterns here indicate curriculum-level issues, not individual faculty failures."
        action={<SectionLink href="/hod/knowledge-graph" label="Full Graph" />}
      >
        <div className="space-y-4">
          {KNOWLEDGE_GRAPH_DATA.map((item) => (
            <div key={item.topic} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-white">{item.topic}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Weak across <span className="text-lumina-highlight font-bold">{item.weakAcross}</span> classes
                    {" · "}
                    <span
                      className={cn(
                        "font-bold",
                        item.type === "curriculum" ? "text-red-400" : item.type === "faculty" ? "text-yellow-400" : "text-blue-400"
                      )}
                    >
                      {item.type === "curriculum" ? "Curriculum Issue" : item.type === "faculty" ? "Faculty Issue" : "Student Issue"}
                    </span>
                  </p>
                </div>
                <span className="text-2xl font-display font-bold text-white">{item.avgMastery}%</span>
              </div>
              <ProgressBar value={item.avgMastery} />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />Curriculum Issue</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-yellow-400" />Faculty Issue</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400" />Student Issue</span>
        </div>
      </Panel>

      {/* ── Syllabus Completion Tracker ─────────────────────────────────────── */}
      <Panel
        title="📚 Syllabus Completion Tracker"
        subtitle="Real-time pace vs. remaining academic calendar. HOD can intervene on critical-delay subjects."
        action={<SectionLink href="/hod/syllabus-tracker" label="Full Tracker" />}
      >
        <div className="space-y-4">
          {SYLLABUS_DATA.map((s) => (
            <div key={s.subject} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-white">{s.subject}</p>
                  <p className="text-xs text-gray-400">{s.faculty} · {s.daysLeft} days left</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">{s.covered}%</span>
                  <StatusBadge status={s.status} />
                </div>
              </div>
              <ProgressBar value={s.covered} />
            </div>
          ))}
        </div>
      </Panel>

      {/* ── AI Verification SLA Monitor ─────────────────────────────────────── */}
      <Panel
        title="⏱ AI Verification SLA Monitor"
        subtitle="Track how quickly faculty verify AI-generated answers. Delays mean students are stuck waiting."
        action={<SectionLink href="/hod/sla-monitor" label="Full Monitor" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {SLA_DATA.map((s) => (
            <div
              key={s.faculty}
              className={cn(
                "rounded-xl border p-4",
                s.slaBreached ? "border-red-500/20 bg-red-500/5" : "border-white/10 bg-white/[0.02]"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-white">{s.faculty}</p>
                {s.slaBreached ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/20">
                    SLA Breached
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-green-500/10 text-green-400 border-green-500/20">
                    Compliant
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Pending Answers</p>
                  <p className={cn("font-bold mt-0.5", s.pendingAnswers > 5 ? "text-red-400" : "text-white")}>
                    {s.pendingAnswers}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Avg Wait</p>
                  <p className={cn("font-bold mt-0.5", s.avgWaitHrs > 4 ? "text-red-400" : "text-white")}>
                    {s.avgWaitHrs}h
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* ── Faculty Performance Monitoring ──────────────────────────────────── */}
      <Panel
        title="📊 Faculty Performance Monitoring"
        subtitle="Support & improvement tracking — not punitive. Identifies faculty who need resources or assistance."
        action={<SectionLink href="/hod/faculty-performance" label="Full Report" />}
      >
        <div className="space-y-4">
          {FACULTY_PERFORMANCE_DATA.map((f) => (
            <div key={f.name} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-lumina-highlight/10 flex items-center justify-center text-lumina-highlight font-bold text-sm">
                    {f.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{f.name}</p>
                    <p className="text-xs text-gray-400">{f.load} subjects</p>
                  </div>
                </div>
                <StatusBadge status={f.status} />
              </div>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">AI Verify</p>
                  <p className={cn("font-bold mt-0.5", f.avgVerifyHrs > 4 ? "text-red-400" : f.avgVerifyHrs > 2 ? "text-yellow-400" : "text-green-400")}>
                    {f.avgVerifyHrs}h
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Grading</p>
                  <p className={cn("font-bold mt-0.5", f.gradingSpeed < 60 ? "text-red-400" : f.gradingSpeed < 80 ? "text-yellow-400" : "text-green-400")}>
                    {f.gradingSpeed}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Satisfaction</p>
                  <p className="font-bold mt-0.5 text-white">{f.satisfaction}/5</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Syllabus</p>
                  <p className={cn("font-bold mt-0.5", f.syllabusComplete < 65 ? "text-red-400" : f.syllabusComplete < 80 ? "text-yellow-400" : "text-green-400")}>
                    {f.syllabusComplete}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* ── At-Risk Student Analysis ─────────────────────────────────────────── */}
      <Panel
        title="🚨 At-Risk Student Analysis"
        subtitle="Students struggling across multiple subjects. Coordinate with counselor and faculty for intervention."
        action={<SectionLink href="/hod/at-risk" label="Full Analysis" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {AT_RISK_DATA.map((s) => (
            <div
              key={s.name}
              className={cn(
                "rounded-xl border p-4",
                s.risk === "critical" ? "border-red-500/20 bg-red-500/5" : "border-yellow-500/20 bg-yellow-500/5"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm text-white">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{s.name}</p>
                    <p className="text-xs text-gray-400">Last active: {s.lastActive}</p>
                  </div>
                </div>
                <StatusBadge status={s.risk} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Failing Subjects</p>
                  <p className="font-bold mt-0.5 text-white">{s.subjects}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Mastery</p>
                  <p className={cn("font-bold mt-0.5", s.mastery < 40 ? "text-red-400" : "text-yellow-400")}>
                    {s.mastery}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* ── Intervention Toolkit ─────────────────────────────────────────────── */}
      <Panel
        title="⚡ Intervention Toolkit"
        subtitle="Take immediate action. All interventions are logged and tracked for effectiveness."
        action={<SectionLink href="/hod/interventions" label="Manage All" />}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: BookOpen, label: "Assign Extra Content", desc: "Push supplementary material to struggling students", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
            { icon: CalendarCheck, label: "Schedule Revision Class", desc: "Book a focused revision session for a weak topic", color: "text-green-400 bg-green-500/10 border-green-500/20" },
            { icon: MessageSquare, label: "Call Faculty Meeting", desc: "Convene department-level discussion on academic issues", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
            { icon: Shield, label: "Escalate to Admin", desc: "Flag critical issues for institutional leadership", color: "text-red-400 bg-red-500/10 border-red-500/20" },
            { icon: Activity, label: "Trigger Counselor Support", desc: "Connect at-risk students with the counseling team", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
            { icon: TrendingUp, label: "Monitor Improvement", desc: "Track the effect of previous interventions", color: "text-lumina-highlight bg-lumina-highlight/10 border-lumina-highlight/20" },
          ].map((action) => (
            <Link
              key={action.label}
              href="/hod/interventions"
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-white/20 hover:bg-white/[0.04] transition-all group"
            >
              <div className={cn("h-10 w-10 rounded-xl border flex items-center justify-center mb-3", action.color)}>
                <action.icon className="h-5 w-5" />
              </div>
              <p className="font-semibold text-white text-sm group-hover:text-lumina-highlight transition-colors">{action.label}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{action.desc}</p>
            </Link>
          ))}
        </div>
      </Panel>

      {/* ── Alumni Feedback Integration ──────────────────────────────────────── */}
      <Panel
        title="🎓 Alumni Feedback Integration"
        subtitle="Industry relevance scores from alumni surveys. Inform curriculum decisions with real-world signal."
        action={<SectionLink href="/hod/alumni-feedback" label="Full Report" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {ALUMNI_FEEDBACK.map((f) => (
            <div key={f.topic} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-white">{f.topic}</p>
                <span
                  className={cn(
                    "text-sm font-display font-bold",
                    f.relevanceScore >= 80 ? "text-green-400" : f.relevanceScore >= 55 ? "text-yellow-400" : "text-red-400"
                  )}
                >
                  {f.relevanceScore}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{f.industry}</p>
              <ProgressBar value={f.relevanceScore} />
              <p className="text-xs text-gray-400 mt-2 italic">"{f.feedback}"</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* ── Teacher Requests & Faculty Overview ──────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Teacher Assignment Requests"
          subtitle="Course and section assignment approval requests from faculty."
        >
          {data.requests.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No pending requests"
              detail="All teacher assignment requests have been processed."
              compact
            />
          ) : (
            <div className="space-y-4">
              {data.requests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-white">{request.teacher_name}</p>
                    <p className="text-sm text-gray-400">
                      {request.course_name} • Sem {request.semester_number}
                    </p>
                    <p className="text-xs text-lumina-highlight/80">{request.program_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequestAction(request.id, true)}
                      disabled={processingRequestId === request.id}
                      className="p-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                      title="Approve"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleRequestAction(request.id, false)}
                      disabled={processingRequestId === request.id}
                      className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                      title="Reject"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Faculty Overview"
          subtitle="Current teaching staff in the department."
          action={<SectionLink href="/hod/teachers" label="Manage" />}
        >
          {data.teachers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No teachers found"
              detail="No faculty members are currently assigned to this department."
              compact
            />
          ) : (
            <div className="space-y-3">
              {data.teachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="h-10 w-10 rounded-full bg-lumina-highlight/10 flex items-center justify-center text-lumina-highlight font-bold">
                    {teacher.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{teacher.name}</p>
                    <p className="text-xs text-gray-400">{teacher.email}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-400">
                      {teacher.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* ── Department Programs ──────────────────────────────────────────────── */}
      <Panel
        title="Department Programs"
        subtitle="Active academic programs managed by this department."
        action={<SectionLink href="/hod/programs" label="Manage" />}
      >
        {data.programs.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No programs yet"
            detail="Define programs and curricula to begin academic operations."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.programs.map((program) => (
              <div key={program.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-lumina-highlight px-2 py-0.5 rounded bg-lumina-highlight/10 border border-lumina-highlight/20">
                    {program.level}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">{program.code}</span>
                </div>
                <h3 className="text-lg font-semibold text-white truncate">{program.name}</h3>
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  <GraduationCap className="h-4 w-4" />
                  <span>Curriculum Assigned</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
