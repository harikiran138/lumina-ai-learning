"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  GraduationCap,
  PlusCircle,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/StatCard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TeacherSummary {
  totalStudents: number;
  activeCourses: number;
  avgMastery: number;
  pendingGrading: number;
  atRiskStudents: number;
  upcomingDeadlines: number;
}

interface TeacherCourseCard {
  id: string;
  title: string;
  code?: string;
  description?: string;
  status: string;
  studentCount: number;
  assignmentCount: number;
  pendingGrading: number;
  averageProgress: number;
  averageMastery: number;
  moduleCount: number;
  nextDeadline?: string | null;
  lastActivity?: string | null;
  image?: string;
  href: string;
  attention: "healthy" | "watch";
}

interface TeacherAssignmentCard {
  id: string;
  title: string;
  courseName: string;
  description?: string;
  dueDate?: string | null;
  daysUntilDue?: number | null;
  submissionCount: number;
  pendingGrading: number;
  status: "scheduled" | "due-soon" | "overdue";
  href: string;
}

interface TeacherStudentMomentum {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: "needs-attention" | "watch" | "on-track";
  courseCount: number;
  courses: string[];
  averageProgress: number;
  averageMastery: number;
  lastActive?: string | null;
  focusArea: string;
  href: string;
}

interface TeacherPriorityItem {
  id: string;
  kind: string;
  tone: "urgent" | "watch" | "info";
  title: string;
  detail: string;
  href: string;
}

interface TeacherIntervention {
  id: string;
  studentId: string;
  studentName: string;
  riskLevel: string;
  topicId?: string | null;
  priority: string;
  status: string;
  recommendedAction: string;
  reason: string;
  confidence: number;
  evidence?: Record<string, any>;
  suggestedMessage?: string;
  misconceptions?: any[];
  weakTopics?: string[];
}

interface TeacherHeatmapItem {
  topic_id: string;
  average_mastery: number;
  student_count: number;
  risk_count: number;
}

interface TeacherSupportCluster {
  topic: string;
  students: { id: string; name: string }[];
  riskCount: number;
  recommendedAction: string;
}

interface TeacherWeeklySnapshot {
  publishedCourses: number;
  draftCourses: number;
  assignmentsCreated: number;
  submissionsReceived: number;
}

interface TeacherDashboardData {
  summary?: Partial<TeacherSummary>;
  courses?: TeacherCourseCard[];
  recentAssignments?: TeacherAssignmentCard[];
  studentMomentum?: TeacherStudentMomentum[];
  priorityItems?: TeacherPriorityItem[];
  weeklySnapshot?: Partial<TeacherWeeklySnapshot>;
  interventionQueue?: TeacherIntervention[];
  conceptHeatmap?: TeacherHeatmapItem[];
  supportClusters?: TeacherSupportCluster[];
}

const EMPTY_SUMMARY: TeacherSummary = {
  totalStudents: 0,
  activeCourses: 0,
  avgMastery: 0,
  pendingGrading: 0,
  atRiskStudents: 0,
  upcomingDeadlines: 0,
};

const EMPTY_SNAPSHOT: TeacherWeeklySnapshot = {
  publishedCourses: 0,
  draftCourses: 0,
  assignmentsCreated: 0,
  submissionsReceived: 0,
};

function formatDate(value?: string | null) {
  if (!value) return "No date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No date";
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "No activity yet";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No activity yet";
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function dueLabel(item: TeacherAssignmentCard) {
  if (item.daysUntilDue == null) return "No due date";
  if (item.daysUntilDue < 0) return `${Math.abs(item.daysUntilDue)}d overdue`;
  if (item.daysUntilDue === 0) return "Due today";
  return `Due in ${item.daysUntilDue}d`;
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

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
  tone,
}: {
  href: string;
  icon: typeof PlusCircle;
  title: string;
  description: string;
  tone: "gold" | "amber" | "yellow";
}) {
  const toneStyles = {
    gold: "from-lumina-highlight/20 to-lumina-highlight/5 border-lumina-highlight/20 text-lumina-highlight",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-400/20 text-amber-200",
    yellow: "from-amber-400/20 to-amber-600/5 border-amber-400/20 text-amber-500",
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

export default function TeacherDashboard() {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingInterventionId, setUpdatingInterventionId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await api.getDashboardData("teacher");
        setData(payload);
      } catch (err: any) {
        console.error("teacher_dashboard_load_failed", err);
        setError(err?.message || "Unable to load teacher dashboard");
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
        <h1 className="text-xl font-semibold text-white">Teacher dashboard unavailable</h1>
        <p className="mt-2 text-sm text-gray-400">{error}</p>
      </div>
    );
  }

  const summary = { ...EMPTY_SUMMARY, ...(data?.summary || {}) };
  const courses = data?.courses || [];
  const assignments = data?.recentAssignments || [];
  const momentum = data?.studentMomentum || [];
  const priorityItems = data?.priorityItems || [];
  const weeklySnapshot = { ...EMPTY_SNAPSHOT, ...(data?.weeklySnapshot || {}) };
  const interventionQueue = data?.interventionQueue || [];
  const heatmap = data?.conceptHeatmap || [];
  const supportClusters = data?.supportClusters || [];

  const updateIntervention = async (
    interventionId: string,
    status: "acknowledged" | "resolved",
    actionTaken?: string,
  ) => {
    setUpdatingInterventionId(interventionId);
    try {
      const payload = await api.updateIntervention(interventionId, {
        status,
        action_taken: actionTaken,
      });
      setData((prev) => {
        if (!prev) return prev;
        const updatedQueue = (prev.interventionQueue || [])
          .map((item) =>
            item.id === interventionId
              ? { ...item, status: payload?.status || status }
              : item,
          )
          .filter((item) => item.status !== "resolved");
        return { ...prev, interventionQueue: updatedQueue };
      });
    } finally {
      setUpdatingInterventionId(null);
    }
  };

  const overrideIntervention = async (item: TeacherIntervention) => {
    const override = window.prompt(
      "Override recommended action",
      item.recommendedAction,
    );
    if (!override) return;
    await updateIntervention(item.id, "acknowledged", override);
  };

  return (
    <div className="space-y-8">
      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="grid gap-6 p-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(340px,1fr)]">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">
              Teacher Command Center
            </p>
            <h1 className="max-w-3xl text-4xl font-display font-bold tracking-tight text-white md:text-6xl">
              Run your classroom from one <span className="text-lumina-highlight border-b-4 border-lumina-highlight/30">live operating view.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-gray-400 leading-relaxed">
              Course health, grading load, and student momentum are connected now,
              so you can move from insight to action without jumping between pages.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <QuickAction
                href="/teacher/create-course"
                icon={PlusCircle}
                title="Create course"
                description="Launch a new learning track with modules and publishing controls."
                tone="gold"
              />
              <QuickAction
                href="/teacher/assignments/create"
                icon={ClipboardCheck}
                title="Create assignment"
                description="Set deadlines, collect submissions, and push work into grading."
                tone="amber"
              />
              <QuickAction
                href="/teacher/ai-generator"
                icon={Sparkles}
                title="Generate with AI"
                description="Draft content faster with the course generator and tutor tooling."
                tone="gold"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-semibold text-white">This week</p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <SnapshotTile
                icon={BookOpen}
                label="Published"
                value={weeklySnapshot.publishedCourses}
              />
              <SnapshotTile
                icon={FileText}
                label="Drafts"
                value={weeklySnapshot.draftCourses}
              />
              <SnapshotTile
                icon={CalendarDays}
                label="Assignments"
                value={weeklySnapshot.assignmentsCreated}
              />
              <SnapshotTile
                icon={CheckCircle2}
                label="Submissions"
                value={weeklySnapshot.submissionsReceived}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-4">
        <StatCard
          title="Students"
          value={summary.totalStudents}
          subtitle="Tracked across your courses"
          icon={Users}
          color="gold"
        />
        <StatCard
          title="Active Courses"
          value={summary.activeCourses}
          subtitle="Courses under your ownership"
          icon={BookOpen}
          color="gold"
        />
        <StatCard
          title="Avg Mastery"
          value={`${summary.avgMastery}%`}
          subtitle="Current learner comprehension"
          icon={TrendingUp}
          color="gold"
        />
        <StatCard
          title="Pending Grading"
          value={summary.pendingGrading}
          subtitle={`${summary.upcomingDeadlines} tasks need attention`}
          icon={ClipboardCheck}
          color="gold"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <Panel
          title="Course Health"
          subtitle="Every course now surfaces enrollment, mastery, grading load, and the next deadline."
          action={
            <Link
              href="/teacher/courses"
              className="inline-flex items-center gap-2 text-sm font-semibold text-lumina-highlight transition-colors hover:text-white"
            >
              View all courses
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {courses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No teacher-owned courses yet"
              detail="Create your first course to start tracking learner progress and grading load."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {courses.slice(0, 4).map((course) => (
                <Link
                  key={course.id}
                  href={course.href}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div
                    className="h-36 bg-cover bg-center"
                    style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.7)), url(${course.image})` }}
                  />
                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
                          {course.code || "COURSE"}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-white">{course.title}</h3>
                      </div>
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                          course.attention === "healthy"
                            ? "border-lumina-highlight/20 bg-lumina-highlight/10 text-lumina-highlight"
                            : "border-amber-400/20 bg-amber-400/10 text-amber-300",
                        )}
                      >
                        {course.attention === "healthy" ? "Stable" : "Watch"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                      <Metric label="Students" value={course.studentCount} />
                      <Metric label="Modules" value={course.moduleCount} />
                      <Metric label="Mastery" value={`${course.averageMastery}%`} />
                      <Metric label="To Grade" value={course.pendingGrading} />
                    </div>

                    <div className="space-y-2">
                      <ProgressBar label="Average progress" value={course.averageProgress} />
                      <ProgressBar label="Average mastery" value={course.averageMastery} accent="yellow" />
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Next deadline: {formatDate(course.nextDeadline)}</span>
                      <span>Last activity: {formatDateTime(course.lastActivity)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Priority Queue" subtitle="What needs a teacher decision first.">
            {priorityItems.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Queues are clear"
                detail="No urgent grading, deadline, or student interventions are waiting right now."
                compact
              />
            ) : (
              <div className="space-y-3">
                {priorityItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    <div
                      className={cn(
                        "mt-0.5 rounded-xl p-2",
                        item.tone === "urgent"
                          ? "bg-red-500/10 text-red-300"
                          : item.tone === "watch"
                            ? "bg-amber-400/10 text-amber-300"
                            : "bg-amber-500/10 text-amber-300",
                      )}
                    >
                      {item.kind === "student" ? (
                        <Users className="h-4 w-4" />
                      ) : item.kind === "grading" ? (
                        <ClipboardCheck className="h-4 w-4" />
                      ) : (
                        <Clock3 className="h-4 w-4" />
                      )}
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

          <Panel title="Classroom Signals" subtitle="Teacher-wide risk and delivery indicators.">
            <div className="space-y-3">
              <SignalRow
                icon={AlertTriangle}
                label="Students needing intervention"
                value={summary.atRiskStudents}
                tone={summary.atRiskStudents > 0 ? "warning" : "gold"}
              />
              <SignalRow
                icon={CalendarDays}
                label="Deadlines approaching"
                value={summary.upcomingDeadlines}
                tone={summary.upcomingDeadlines > 0 ? "warning" : "gold"}
              />
              <SignalRow
                icon={GraduationCap}
                label="Average mastery"
                value={`${summary.avgMastery}%`}
                tone={summary.avgMastery < 70 ? "warning" : "gold"}
              />
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <Panel
          title="Intervention Queue"
          subtitle="Prioritized learners who need intervention, with evidence and suggested action."
        >
          {interventionQueue.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No active interventions"
              detail="When a learner is flagged as at-risk, they will appear here with a suggested action."
            />
          ) : (
            <div className="space-y-4">
              {interventionQueue.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {item.studentName}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {item.topicId || "General"} • Risk: {item.riskLevel}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                        item.priority === "critical" || item.priority === "high"
                          ? "border-red-400/20 bg-red-400/10 text-red-300"
                          : item.priority === "medium"
                            ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                            : "border-amber-200/20 bg-amber-200/10 text-amber-200",
                      )}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-300">{item.reason}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    Suggested action:{" "}
                    <span className="text-white">{item.recommendedAction}</span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Confidence: {Math.round((item.confidence || 0) * 100)}%
                  </p>
                  {item.weakTopics?.length ? (
                    <p className="mt-2 text-xs text-gray-500">
                      Weak topics: {item.weakTopics.slice(0, 3).join(", ")}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white hover:border-white/20"
                      onClick={() => updateIntervention(item.id, "acknowledged")}
                      disabled={updatingInterventionId === item.id}
                    >
                      Mark reviewed
                    </button>
                    <button
                      className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-200 hover:border-yellow-300/40"
                      onClick={() => updateIntervention(item.id, "resolved")}
                      disabled={updatingInterventionId === item.id}
                    >
                      Resolve
                    </button>
                    <button
                      className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200 hover:border-amber-300/40"
                      onClick={() => overrideIntervention(item)}
                      disabled={updatingInterventionId === item.id}
                    >
                      Override action
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Concept Heatmap" subtitle="Class-wide mastery by topic.">
            {heatmap.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="No concept signals yet"
                detail="Once assessments run, concept mastery data will appear here."
                compact
              />
            ) : (
              <div className="space-y-3">
                {heatmap.slice(0, 8).map((item) => (
                  <div
                    key={item.topic_id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="flex items-center justify-between text-sm text-white">
                      <span>{item.topic_id}</span>
                      <span className="text-xs text-gray-400">
                        {Math.round(item.average_mastery * 100)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-lumina-highlight"
                        style={{ width: `${Math.round(item.average_mastery * 100)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {item.student_count} students • {item.risk_count} at risk
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Support Clusters" subtitle="Suggested regrouping for focused remediation.">
            {supportClusters.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No clusters yet"
                detail="Clusters appear when multiple students share the same weak topic."
                compact
              />
            ) : (
              <div className="space-y-3">
                {supportClusters.slice(0, 4).map((cluster) => (
                  <div
                    key={cluster.topic}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-white">
                      {cluster.topic}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {cluster.students.map((student) => student.name).join(", ")}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {cluster.recommendedAction}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <Panel
        title="Recent Assignments"
        subtitle="Deadlines, submission volume, and grading load are linked here."
        action={
          <Link
            href="/teacher/assignments"
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300 transition-colors hover:text-white"
          >
            Open assignments
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      >
        {assignments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No assignments yet"
            detail="Assignments you create will appear here with submission and grading state."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.22em] text-gray-500">
                  <th className="pb-4 pr-6">Assignment</th>
                  <th className="pb-4 pr-6">Course</th>
                  <th className="pb-4 pr-6">Due</th>
                  <th className="pb-4 pr-6">Submissions</th>
                  <th className="pb-4">Queue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {assignments.map((item) => (
                  <tr key={item.id} className="text-sm">
                    <td className="py-4 pr-6">
                      <Link href={item.href} className="font-semibold text-white hover:text-amber-300">
                        {item.title}
                      </Link>
                      <p className="mt-1 line-clamp-1 text-gray-400">{item.description || "Assignment activity"}</p>
                    </td>
                    <td className="py-4 pr-6 text-gray-300">{item.courseName}</td>
                    <td className="py-4 pr-6">
                      <div className="text-white">{formatDate(item.dueDate)}</div>
                      <div className="mt-1 text-xs text-gray-500">{dueLabel(item)}</div>
                    </td>
                    <td className="py-4 pr-6 text-gray-300">{item.submissionCount}</td>
                    <td className="py-4">
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs font-semibold",
                          item.pendingGrading > 0
                            ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                            : "border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
                        )}
                      >
                        {item.pendingGrading > 0
                          ? `${item.pendingGrading} to grade`
                          : "Up to date"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="Student Momentum"
        subtitle="Roster health is derived from course progress, mastery, and recency of activity."
        action={
          <Link
            href="/teacher/students"
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300 transition-colors hover:text-white"
          >
            Open students
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      >
        {momentum.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No enrolled students yet"
            detail="Once students join your courses, their momentum and risk signals will appear here."
          />
        ) : (
          <div className="space-y-3">
            {momentum.slice(0, 6).map((student) => (
              <Link
                key={student.id}
                href={student.href}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/20 hover:bg-white/[0.05] lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="h-12 w-12 rounded-2xl border border-white/10 object-cover"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="truncate font-semibold text-white">{student.name}</p>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em]",
                          student.status === "on-track"
                            ? "border-lumina-highlight/20 bg-lumina-highlight/10 text-lumina-highlight"
                            : student.status === "watch"
                              ? "border-amber-400/20 bg-amber-400/10 text-lumina-highlight"
                              : "border-red-400/20 bg-red-400/10 text-red-300",
                        )}
                      >
                        {student.status.replace("-", " ")}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-400">{student.email}</p>
                    <p className="mt-1 truncate text-xs text-gray-500">
                      Focus area: {student.focusArea} • {student.courseCount} course(s)
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px] lg:grid-cols-3">
                  <ProgressChip label="Progress" value={student.averageProgress} accent="amber" />
                  <ProgressChip label="Mastery" value={student.averageMastery} accent="yellow" />
                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Last Active</p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {formatDateTime(student.lastActive)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function SnapshotTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-white/5 p-2 text-lumina-highlight">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  detail,
  compact = false,
}: {
  icon: typeof BookOpen;
  title: string;
  detail: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-dashed border-white/10 bg-white/[0.02] text-center",
        compact ? "p-6" : "p-10",
      )}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-400">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">{detail}</p>
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

function ProgressBar({
  label,
  value,
  accent = "amber",
}: {
  label: string;
  value: number;
  accent?: "amber" | "yellow";
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className={cn(
            "h-2 rounded-full",
            accent === "amber" ? "bg-lumina-highlight" : "bg-amber-400",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function SignalRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof AlertTriangle;
  label: string;
  value: string | number;
  tone: "warning" | "gold";
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "rounded-xl p-2",
            tone === "gold" ? "bg-amber-100/10 text-amber-100" : "bg-lumina-highlight/10 text-lumina-highlight",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-sm text-white">{label}</p>
      </div>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function ProgressChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "amber" | "yellow";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-2 flex-1 rounded-full bg-white/10">
          <div
            className={cn(
              "h-2 rounded-full",
              accent === "amber" ? "bg-lumina-highlight" : "bg-amber-200",
            )}
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-white">{value}%</span>
      </div>
    </div>
  );
}
