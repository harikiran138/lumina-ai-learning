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
import { WellbeingCheckin } from "@/components/student/WellbeingCheckin";
import { cn } from "@/lib/utils";

// --- Types ---
type DashboardPriority = "critical" | "high" | "medium" | "low";

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
    <section className={cn("glass-v2-gold border-border overflow-hidden rounded-[2.5rem]", className)}>
      <div className="flex items-start justify-between gap-4 p-6 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-surface border border-border flex items-center justify-center text-primary">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">
                {title}
              </h2>
              {subtitle ? (
                <p className="text-sm text-text-muted mt-1">{subtitle}</p>
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [linkStatus, setLinkStatus] = useState<"pending" | "linked">("pending");

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

  const refreshLinkCode = async () => {
    setIsRefreshing(true);
    try {
      const resp = await api.studentRefreshLinkCode();
      setDashboardData({
        ...dashboardData,
        meta: {
          ...dashboardData.meta,
          parentLinkCode: resp.token
        }
      });
    } catch (e) {
      console.error("refresh_link_code_failed", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!dashboardData) return;
    if (dashboardData.meta?.parentLinked) {
      setLinkStatus("linked");
      return;
    }
    const interval = setInterval(async () => {
       try {
         const resp = await api.studentGetParentConnectionStatus();
         if (resp.status === "linked") {
           setLinkStatus("linked");
           clearInterval(interval);
           loadDashboard();
         }
       } catch (e) {}
    }, 5000);
    return () => clearInterval(interval);
  }, [dashboardData]);

  const getStatValue = (label: string, fallback = "0") => {
    if (!Array.isArray(dashboardData?.stats)) return fallback;
    return dashboardData.stats.find((s: any) => s.label === label)?.value || fallback;
  };

  if (isLoading) return <LoadingState />;
  if (error || !dashboardData) return <ErrorState error={error} retry={loadDashboard} />;

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
            className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-black inline-flex items-center gap-3 hover:scale-105 transition-all shadow-xl hover:shadow-primary/20 active:scale-95"
          >
            Start Learning Session
            <ShieldCheck className="w-5 h-5" />
          </Link>
          <Link
            href="/student/course_explorer"
            className="h-14 px-8 rounded-2xl border border-border text-foreground font-bold inline-flex items-center gap-3 hover:bg-surface transition-all"
          >
            Course Explorer
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SectionCard title="Optimal Path" subtitle="AI-curated next best action." icon={Sparkles}>
          {nextAction ? (
             <NextActionWidget action={nextAction} />
          ) : (
            <EmptyState title="Path Generating..." description="Keep interacting with your courses." />
          )}
        </SectionCard>

        <SectionCard title="Mastery Orb" subtitle="Your proficiency index." icon={Target}>
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <MasteryOrb progress={parseInt(getStatValue('Overall Mastery')) || 0} size="lg" />
            <div className="mt-8 grid grid-cols-2 gap-8 w-full border-t border-white/5 pt-8">
               <MiniMetric label="Risk Level" value={normalizeLabel(meta?.riskLevel || "Low")} />
               <MiniMetric label="Engagement" value="High" />
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <SectionCard title="Resume Performance" subtitle="Pick up where you left off." icon={BookOpen}>
          {resumeCourse ? <ResumeWidget course={resumeCourse} /> : <EmptyState title="No Active Course" description="Start a new course!" />}
        </SectionCard>
        <SectionCard title="AI Coach Insight" subtitle="Real-time intervention." icon={Bot}>
          {coachInsight ? <CoachWidget insight={coachInsight} /> : <EmptyState title="No active insights" description="AI coach is monitoring." />}
        </SectionCard>
      </div>

      <div className="mt-8">
         <WellbeingCheckin studentId={dashboardData.meta?.studentId || "unknown"} />
      </div>

      <div className="mt-8">
        <ParentAccessWidget linkStatus={linkStatus} meta={meta} isRefreshing={isRefreshing} refreshLinkCode={refreshLinkCode} />
      </div>
    </StandardDashboard>
  );
}

// --- Sub-components for brevity ---
function LoadingState() {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Bot className="w-12 h-12 text-primary animate-pulse mb-4" />
        <p className="text-primary text-sm font-black uppercase tracking-[0.3em]">Initializing Terminal...</p>
      </div>
    );
}

function ErrorState({ error, retry }: { error: string | null, retry: () => void }) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-12 glass-v2-gold border-danger/20 max-w-md">
          <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">Sync Interrupted</h2>
          <p className="text-text-muted mb-8">{error || "Connection failed."}</p>
          <button onClick={retry} className="w-full h-14 bg-surface border border-border text-foreground font-black uppercase rounded-2xl flex items-center justify-center gap-3">
            <RefreshCw className="w-4 h-4" /> Retry Connection
          </button>
        </div>
      </div>
    );
}

function NextActionWidget({ action }: { action: any }) {
    return (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <StatusPill tone={getPriorityTone(action.priority)}>{normalizeLabel(action.priority)} priority</StatusPill>
            <StatusPill tone="neutral">{normalizeLabel(action.kind)}</StatusPill>
          </div>
          <h3 className="text-3xl font-bold text-white mb-2">{action.title}</h3>
          <p className="text-gray-400">{action.description}</p>
          <Link href={action.href} className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
            {action.ctaLabel} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
    );
}

function ResumeWidget({ course }: { course: any }) {
    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold">{course.title}</h3>
            <ProgressBar value={course.progress || 0} />
            <Link href={course.href} className="h-12 w-full rounded-2xl bg-surface border border-border flex items-center justify-center gap-2">
                Resume Course <CheckCircle className="w-4 h-4" />
            </Link>
        </div>
    );
}

function CoachWidget({ insight }: { insight: any }) {
    return (
        <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10">
          <h3 className="text-xl font-bold mb-4">{insight.title}</h3>
          <p className="text-text-muted text-sm mb-6">{insight.summary}</p>
          <Link href={insight.href || "#"} className="text-primary font-black uppercase tracking-widest text-xs">
            {insight.actionLabel || "View Action"} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
    );
}

function ParentAccessWidget({ linkStatus, meta, isRefreshing, refreshLinkCode }: any) {
    return (
        <SectionCard title="Parent Access" subtitle="Link your account." icon={ShieldCheck}>
          <div className={cn("flex flex-col md:row items-center justify-between gap-6 rounded-3xl p-8", linkStatus === "linked" ? "bg-primary/10" : "bg-white/5")}>
            <div>
                <h3 className="text-[10px] uppercase tracking-[0.25em] text-text-muted font-black">Secure Mapping</h3>
                <p className="text-text-muted text-sm max-w-sm mt-2">Required for parental monitoring and shared reports.</p>
            </div>
            {linkStatus === "linked" ? (
                <div className="bg-primary/20 px-8 py-4 rounded-2xl font-bold">LINKED TO PARENT</div>
            ) : (
                <div className="bg-black/60 border-2 border-dashed border-primary/50 rounded-2xl px-12 py-6 text-4xl font-mono font-black text-primary">
                    {meta?.parentLinkCode || "••••••••"}
                </div>
            )}
          </div>
        </SectionCard>
    );
}

// --- Utils ---
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
      <div className="h-full bg-primary" style={{ width: `${value}%` }} />
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="text-xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

function StatusPill({ children, tone }: { children: ReactNode; tone: any }) {
  const tones = {
    accent: "bg-primary/10 text-primary border-primary/20",
    neutral: "bg-white/5 text-gray-400 border-white/10",
    success: "bg-primary/10 text-primary",
    warning: "bg-amber-500/10 text-amber-300",
    danger: "bg-red-500/10 text-red-300",
  };
  return <span className={cn("px-3 py-1 rounded-full text-[10px] uppercase font-bold border", tones[tone as keyof typeof tones])}>{children}</span>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
    return <div className="text-center p-8 border border-dashed border-white/10 rounded-3xl"><p className="font-bold">{title}</p><p className="text-xs text-text-muted">{description}</p></div>;
}

function normalizeLabel(v: string) { return v.replace(/_/g, " "); }
function getPriorityTone(p: DashboardPriority) { return p === "critical" ? "danger" : p === "high" ? "warning" : "accent"; }
