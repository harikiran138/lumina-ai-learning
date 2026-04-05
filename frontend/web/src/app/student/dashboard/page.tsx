"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bot,
  Sparkles,
  Target,
  Trophy,
  RefreshCw,
  ClipboardList,
  CheckCircle,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { StandardDashboard } from "@/components/dashboard/StandardDashboard";
import { MasteryOrb } from "@/components/student/MasteryOrb";
import { cn } from "@/lib/utils";

// --- Types ---

type DashboardPriority = "critical" | "high" | "medium" | "low";

interface WeakTopic {
  topic: string;
  score: number;
  confidence: number;
  attempts: number;
  status: "urgent" | "developing" | "strong";
}

interface DueAssignment {
  id: string;
  title: string;
  courseName: string;
  dueDate?: string;
  daysRemaining?: number | null;
  status: "submitted" | "pending" | "due_soon" | "overdue";
  submitted: boolean;
  href: string;
}

// --- Components ---

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("glass-v2-gold border-white/5 overflow-hidden rounded-[2.5rem]", className)}>
      <div className="flex items-start justify-between gap-4 p-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center justify-center text-lumina-highlight">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white">
                {title}
              </h2>
              {subtitle ? (
                <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
              ) : null}
            </div>
          </div>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default function StudentDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardData("student");
      setDashboardData(data);
    } catch (loadError: any) {
      console.error("student_dashboard_load_failed", loadError);
      setError(loadError?.message || "An error occurred while loading the dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const getStatValue = (label: string, fallback = "0") => {
    if (!Array.isArray(dashboardData?.stats)) return fallback;
    return dashboardData.stats.find((s: any) => s.label === label)?.value || fallback;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] font-mono">
        <div className="relative w-24 h-24 mb-12">
          <div className="absolute inset-0 bg-lumina-highlight/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute inset-0 border-2 border-lumina-highlight/30 rounded-full animate-[ping_3s_infinite]" />
          <div className="relative h-full w-full rounded-full border-t-2 border-lumina-highlight animate-spin flex items-center justify-center">
             <Bot className="w-8 h-8 text-lumina-highlight animate-pulse" />
          </div>
        </div>
        <div className="space-y-3 text-center">
            <p className="text-lumina-highlight text-sm font-black uppercase tracking-[0.3em] animate-pulse">Initializing Terminal...</p>
            <div className="flex flex-col gap-1 text-[10px] text-gray-500 uppercase tracking-widest font-black opacity-40">
                <p className="animate-[fade-in_1s_ease-out_forwards]">Establishing neural link...</p>
                <p className="animate-[fade-in_1s_ease-out_0.2s_forwards] opacity-0">Decrypting learner profile...</p>
                <p className="animate-[fade-in_1s_ease-out_0.4s_forwards] opacity-0">Optimizing cognitive path...</p>
            </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-12 glass-v2-gold border-red-500/20 max-w-md">
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6 mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-2">Sync Interrupted</h2>
          <p className="text-gray-400 mb-8">{error || "The terminal could not establish a secure link to your learner profile."}</p>
          <button 
            onClick={() => loadDashboard()} 
            className="w-full h-14 bg-white/[0.04] border border-white/10 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { meta = {} } = dashboardData || {};
  const nextAction = meta?.nextAction;
  const coachInsight = meta?.coachInsight;
  const resumeCourse = meta?.resumeCourse;

  return (
    <StandardDashboard 
      data={dashboardData}
      title={`Greetings, ${meta?.studentName?.split(' ')[0] || "Scholar"}`}
      subtitle={`Welcome back to your Lumina terminal. You're maintaining a ${getStatValue('Current Streak', '0 day')} streak.`}
      headerAction={
        <div className="flex flex-wrap gap-4 mt-4">
          <Link
            href="/student/ai_tutor"
            className="h-14 px-8 rounded-2xl bg-lumina-highlight text-black font-black inline-flex items-center gap-3 hover:scale-105 transition-all shadow-xl hover:shadow-lumina-highlight/20 active:scale-95"
          >
            Start Learning Session
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/student/course_explorer"
            className="h-14 px-8 rounded-2xl border border-white/10 text-white font-bold inline-flex items-center gap-3 hover:bg-white/5 transition-all"
          >
            Course Explorer
          </Link>
        </div>
      }
    >
      {/* Student-specific Primary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SectionCard
          title="Optimal Path"
          subtitle="AI-curated next best action for maximum retention."
          icon={Sparkles}
        >
          {nextAction ? (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <StatusPill tone={getPriorityTone(nextAction.priority)}>
                  {normalizeLabel(nextAction.priority)} priority
                </StatusPill>
                <StatusPill tone="neutral">
                  {normalizeLabel(nextAction.kind)}
                </StatusPill>
              </div>
              <div>
                <h3 className="text-3xl font-display font-bold text-white mb-2">
                  {nextAction.title}
                </h3>
                <p className="text-gray-400 leading-relaxed max-w-xl">
                  {nextAction.description}
                </p>
              </div>
              <Link
                href={nextAction.href}
                className="inline-flex items-center gap-2 group text-lumina-highlight font-black uppercase tracking-widest text-xs"
              >
                {nextAction.ctaLabel}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ) : (
            <EmptyState
              title="Path Generating..."
              description="Keep interacting with your courses to unlock personalized pathways."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Mastery Orb"
          subtitle="Your real-time skill proficiency index."
          icon={Target}
        >
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <MasteryOrb progress={parseInt(getStatValue('Overall Mastery')) || 0} size="lg" />
            <div className="mt-8 grid grid-cols-2 gap-8 w-full border-t border-white/5 pt-8">
               <MiniMetric label="Risk Level" value={normalizeLabel(meta?.riskLevel || "Low")} />
               <MiniMetric label="Engagement" value="High" />
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SectionCard
            title="Resume Performance"
            subtitle="Pick up where you left off with highest momentum."
            icon={BookOpen}
        >
          {resumeCourse ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-display font-bold text-white mb-2">{resumeCourse.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>{resumeCourse.streak} day streak</span>
                  <span className="text-lumina-highlight font-bold">{resumeCourse.mastery}% mastery</span>
                </div>
              </div>
              <div className="space-y-2">
                <MetricRow label="Course Progress" value={`${resumeCourse.progress}%`} />
                <ProgressBar value={resumeCourse.progress || 0} />
              </div>
              <Link
                href={resumeCourse.href}
                className="h-12 w-full rounded-2xl bg-white/[0.04] border border-white/10 text-white font-bold inline-flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
              >
                Resume Course
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <EmptyState title="No Active Course" description="Start a new course to begin tracking your mastery journey." />
          )}
        </SectionCard>

        <SectionCard
          title="AI Coach Insight"
          subtitle="Real-time intervention cue from your personal tutor."
          icon={Bot}
        >
          {coachInsight ? (
            <div className="p-6 rounded-[2rem] bg-lumina-highlight/5 border border-lumina-highlight/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-lumina-highlight/20 flex items-center justify-center text-lumina-highlight">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">{coachInsight.title}</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {coachInsight.summary}
              </p>
              <Link
                href={coachInsight.href || "#"}
                className="inline-flex items-center gap-2 text-lumina-highlight font-black uppercase tracking-widest text-xs group"
              >
                {coachInsight.actionLabel || "View Action"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ) : (
            <EmptyState title="No active insights" description="Your AI coach is currently monitoring your performance." />
          )}
        </SectionCard>
      </div>

      {/* Parent Access Link Code */}
      <div className="grid grid-cols-1 gap-8">
        <SectionCard
          title="Parent Access"
          subtitle="Share this unique code with your parent to link your accounts."
          icon={ShieldCheck}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-lumina-highlight/5 border border-lumina-highlight/20 rounded-3xl p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-lumina-highlight/10 flex items-center justify-center text-lumina-highlight/40">
                   <ShieldCheck className="w-5 h-5" />
                 </div>
                 <h3 className="text-[10px] uppercase tracking-[0.25em] text-gray-500 font-black">Secure Account Mapping</h3>
              </div>
              <p className="text-gray-400 text-sm max-w-sm leading-relaxed">Required for parental monitoring and shared reports. This code verifies your primary academic identity.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-black/60 border-2 border-white/5 rounded-2xl px-12 py-6 text-4xl font-mono font-black text-lumina-highlight tracking-[0.25em] shadow-[inset_0_2px_20px_rgba(0,0,0,0.8)] border-dashed">
                {meta?.parentLinkCode || "••••••••"}
              </div>
              <button 
                onClick={() => {
                   if (meta?.parentLinkCode) {
                     navigator.clipboard.writeText(meta.parentLinkCode);
                     // Alert or toast would be good
                   }
                }}
                className="h-20 w-20 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-gray-500 hover:text-lumina-highlight hover:bg-lumina-highlight/10 transition-all border-dashed group"
                title="Copy to Clipboard"
              >
                <ClipboardList className="h-8 w-8 group-active:scale-95 group-hover:scale-110 transition-all" />
              </button>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Spaced Repetition + Exam Readiness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SectionCard
          title="Daily Revision"
          subtitle="Spaced repetition keeps your knowledge sharp. Review today's due cards."
          icon={RefreshCw}
          action={
            <Link
              href="/student/spaced_repetition"
              className="inline-flex items-center gap-1.5 text-lumina-highlight font-black uppercase tracking-widest text-[10px] group"
            >
              Open
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          }
        >
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <MiniMetric label="Due Today" value={String(getStatValue("Due Reviews", "5"))} />
              <MiniMetric label="Streak" value={getStatValue("Current Streak", "0 day")} />
              <MiniMetric label="Algorithm" value="SM-2" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Daily spaced repetition prevents forgetting. The system schedules each concept
              just before you would naturally forget it, optimizing long-term memory.
            </p>
            <Link
              href="/student/spaced_repetition"
              className="h-12 w-full rounded-2xl bg-white/[0.04] border border-white/10 text-white font-bold inline-flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
            >
              <CheckCircle className="w-4 h-4 text-lumina-highlight" />
              Start Today&apos;s Revision
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </SectionCard>

        <SectionCard
          title="Exam Readiness"
          subtitle="AI-predicted performance score updated daily from your mastery data."
          icon={ClipboardList}
          action={
            <Link
              href="/student/exam_readiness"
              className="inline-flex items-center gap-1.5 text-lumina-highlight font-black uppercase tracking-widest text-[10px] group"
            >
              Full Report
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          }
        >
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <MiniMetric
                label="Predicted"
                value={getStatValue("Overall Mastery", "—")}
              />
              <MiniMetric label="Risk" value={normalizeLabel(meta?.riskLevel || "Low")} />
              <MiniMetric label="Status" value="On Track" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Based on your BKT mastery model, knowledge graph coverage, and recent
              assessment performance. Weak areas are prioritised automatically.
            </p>
            <Link
              href="/student/exam_readiness"
              className="h-12 w-full rounded-2xl bg-white/[0.04] border border-white/10 text-white font-bold inline-flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
            >
              <Target className="w-4 h-4 text-lumina-highlight" />
              View Readiness Report
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </SectionCard>
      </div>
    </StandardDashboard>
  );
}

// --- Helper Components & Functions ---

function ProgressBar({
  value,
  tone = "from-lumina-highlight to-amber-400",
}: {
  value: number;
  tone?: string;
}) {
  return (
    <div className="w-full h-2 rounded-full bg-white/[0.04] border border-white/5 overflow-hidden">
      <div
        className={cn("h-full rounded-full bg-gradient-to-r", tone)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className="text-xl font-display font-bold text-white mt-2">{value}</p>
    </div>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  href,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  href?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.01] p-8 text-center">
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto">{description}</p>
      {actionLabel && href ? (
        <Link
          href={href}
          className="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-lumina-highlight hover:text-white transition-colors"
        >
          {actionLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      ) : null}
    </div>
  );
}

function StatusPill({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "accent" | "neutral" | "success" | "warning" | "danger";
}) {
  const tones = {
    accent: "bg-lumina-highlight/10 text-lumina-highlight border-lumina-highlight/20",
    neutral: "bg-white/[0.04] text-gray-300 border-white/10",
    success: "bg-lumina-highlight/10 text-lumina-highlight border-lumina-highlight/20",
    warning: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    danger: "bg-red-500/10 text-red-300 border-red-500/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

function normalizeLabel(value: string) {
  return value.replace(/_/g, " ");
}

function getPriorityTone(priority: DashboardPriority) {
  if (priority === "critical") return "danger";
  if (priority === "high") return "warning";
  if (priority === "medium") return "accent";
  return "neutral";
}
