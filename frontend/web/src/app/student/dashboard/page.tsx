"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Line } from "react-chartjs-2";
import {
  AlertTriangle,
  ArrowRight,
  BarChart,
  BookOpen,
  Bot,
  Brain,
  CalendarClock,
  CheckCircle2,
  Clock,
  Clock3,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { api } from "@/lib/api";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { StatCard } from "@/components/dashboard/StatCard";
import { MasteryOrb } from "@/components/student/MasteryOrb";
import { cn } from "@/lib/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

type DashboardPriority = "critical" | "high" | "medium" | "low";

interface CourseCardData {
  id: string;
  name: string;
  title?: string;
  code?: string;
  description?: string;
  progress?: number;
  mastery?: number;
  streak?: number;
}

interface WeeklyActivityPoint {
  label: string;
  date: string;
  minutes: number;
  interactions: number;
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

interface WeakTopic {
  topic: string;
  score: number;
  confidence: number;
  attempts: number;
  status: "urgent" | "developing" | "strong";
}

interface DashboardAction {
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  priority: DashboardPriority;
  kind: string;
}

interface StudyPlanItem {
  title: string;
  detail: string;
  status: "urgent" | "planned" | "focus" | "recommended" | "completed";
  href: string;
  ctaLabel: string;
  kind: string;
}

interface ResumeCourse {
  id: string;
  title: string;
  description?: string;
  progress: number;
  mastery: number;
  streak: number;
  href: string;
}

interface LearningSignals {
  behaviorLabel: string;
  cognitiveLoad: number;
  riskLevel: string;
  riskScore: number;
  reasons: string[];
  engagementScore: number;
  recentAverageScore: number;
}

interface CoachInsight {
  title: string;
  summary: string;
  priority: DashboardPriority;
  actionLabel: string;
  href: string;
}

interface AchievementHighlight {
  title: string;
  detail: string;
  completed: boolean;
}

interface AchievementSummary {
  badgeCount: number;
  unlockedCount: number;
  nextMilestone: string;
  highlights: AchievementHighlight[];
}

interface StudentDashboardData {
  studentName?: string;
  currentStreak?: number;
  overallMastery?: number;
  totalHours?: number;
  weeklyMinutes?: number;
  pendingAssignments?: number;
  enrolledCourses?: CourseCardData[];
  weeklyActivity?: WeeklyActivityPoint[];
  dueAssignments?: DueAssignment[];
  nextAction?: DashboardAction;
  todayPlan?: StudyPlanItem[];
  weakTopics?: WeakTopic[];
  masteryBreakdown?: WeakTopic[];
  resumeCourse?: ResumeCourse | null;
  learningSignals?: LearningSignals;
  coachInsight?: CoachInsight;
  achievementSummary?: AchievementSummary;
  className?: string;
  batch?: string;
}

const EMPTY_ACTIVITY: WeeklyActivityPoint[] = [];

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
    <section className={cn("glass-v2-gold border-white/5 overflow-hidden", className)}>
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
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(
    null,
  );

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await api.getDashboardData("student");
        setDashboardData(data);
      } catch (loadError: any) {
        console.error("student_dashboard_load_failed", loadError);
        setError(
          loadError?.message || "An error occurred while loading the dashboard.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const weeklyActivity = dashboardData?.weeklyActivity ?? EMPTY_ACTIVITY;
  const activityChartData = useMemo(
    () => ({
      labels:
        weeklyActivity.length > 0
          ? weeklyActivity.map((point) => point.label)
          : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Focused Minutes",
          data:
            weeklyActivity.length > 0
              ? weeklyActivity.map((point) => point.minutes)
              : [0, 0, 0, 0, 0, 0, 0],
          borderColor: "#fcc419",
          backgroundColor: "rgba(252, 196, 25, 0.12)",
          fill: true,
          tension: 0.35,
          pointBackgroundColor: "#fcc419",
          pointBorderColor: "#0A0A0A",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    }),
    [weeklyActivity],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lumina-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 glass-card border-lumina-error/30">
          <h2 className="text-xl font-bold text-lumina-error mb-2">Error</h2>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-lumina-error text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const enrolledCourses = dashboardData?.enrolledCourses || [];
  const dueAssignments = dashboardData?.dueAssignments || [];
  const nextAction = dashboardData?.nextAction;
  const weakTopics = dashboardData?.weakTopics || [];
  const masteryBreakdown = dashboardData?.masteryBreakdown || [];
  const todayPlan = dashboardData?.todayPlan || [];
  const learningSignals = dashboardData?.learningSignals;
  const resumeCourse = dashboardData?.resumeCourse;
  const coachInsight = dashboardData?.coachInsight;
  const achievementSummary = dashboardData?.achievementSummary;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col xl:flex-row gap-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 lg:p-12 relative overflow-hidden group">
        {/* Abstract Background for Header */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-lumina-highlight/10 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-700 group-hover:bg-lumina-highlight/15" />
        
        <div className="flex-1 z-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="px-3 py-1 rounded-full bg-lumina-highlight/10 border border-lumina-highlight/20 text-lumina-highlight text-[10px] font-black uppercase tracking-[0.2em]">
               System Status: Optimized
            </div>
            <StatusPill tone="accent">
              {normalizeLabel(learningSignals?.behaviorLabel || "steady")} mode
            </StatusPill>
            <StatusPill
              tone={getRiskTone(learningSignals?.riskLevel || "low")}
            >
              Risk {normalizeLabel(learningSignals?.riskLevel || "low")}
            </StatusPill>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-white mb-2">
            Hey, <span className="text-lumina-highlight">
              {dashboardData?.studentName?.split(' ')[0] || "Scholar"}
            </span>
          </h1>
          
          {dashboardData?.className && (
            <div className="flex items-center gap-2 mb-6 text-white/50 font-medium">
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs">
                {dashboardData.className}
              </span>
              {dashboardData.batch && (
                <span className="text-xs opacity-60">• Batch of {dashboardData.batch}</span>
              )}
            </div>
          )}
          
          <p className="text-gray-400 text-xl max-w-2xl leading-relaxed mb-10">
            You're on a <span className="text-white font-bold">{dashboardData?.currentStreak || 0} day streak</span>. 
            Keep the momentum high to unlock your next achievement.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href={nextAction?.href || "/student/ai_tutor"}
              className="h-14 px-8 rounded-2xl bg-lumina-highlight text-black font-black inline-flex items-center gap-3 hover:scale-105 transition-all shadow-xl hover:shadow-lumina-highlight/20"
            >
              {nextAction?.ctaLabel || "Start Session"}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/student/course_explorer"
              className="h-14 px-8 rounded-2xl border border-white/10 text-white font-bold inline-flex items-center gap-3 hover:bg-white/5 transition-all"
            >
              Course Explorer
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center xl:justify-end z-10 shrink-0">
          <MasteryOrb 
            progress={roundValue(dashboardData?.overallMastery || 0)} 
            size="lg"
          />
        </div>
      </div>

      <DashboardGrid columns={4}>
        <StatCard
          title="Current Streak"
          value={dashboardData?.currentStreak || 0}
          subtitle="Days of consistency"
          icon={Zap}
          color="gold"
          trend={{ value: "+2", isPositive: true }}
        />
        <StatCard
          title="Pending Work"
          value={dashboardData?.pendingAssignments || 0}
          subtitle="Awaiting action"
          icon={Clock}
          color="gold"
        />
        <StatCard
          title="Weekly Focus"
          value={`${roundValue(dashboardData?.weeklyMinutes || 0)}m`}
          subtitle="Focused minutes logged"
          icon={Target}
          color="gold"
        />
        <StatCard
          title="Avg. Mastery"
          value={`${roundValue(dashboardData?.overallMastery || 0)}%`}
          subtitle="Skill proficiency"
          icon={BarChart}
          color="gold"
        />
      </DashboardGrid>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-8">
        <SectionCard
          title="Next Best Action"
          subtitle="The highest-impact task based on your profile, deadlines, and mastery."
          icon={Sparkles}
        >
          {nextAction ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <div className="flex flex-wrap gap-3 mb-4">
                  <StatusPill tone={getPriorityTone(nextAction.priority)}>
                    {normalizeLabel(nextAction.priority)} priority
                  </StatusPill>
                  <StatusPill tone="neutral">
                    {normalizeLabel(nextAction.kind)}
                  </StatusPill>
                </div>
                <h3 className="text-3xl font-display font-bold text-white">
                  {nextAction.title}
                </h3>
                <p className="text-gray-400 mt-3 max-w-2xl leading-relaxed">
                  {nextAction.description}
                </p>
              </div>
              <Link
                href={nextAction.href}
                className="h-12 px-5 rounded-2xl bg-white/[0.04] border border-white/10 text-white font-semibold inline-flex items-center gap-2 hover:border-lumina-highlight/30 hover:text-lumina-highlight transition-all"
              >
                {nextAction.ctaLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <EmptyState
              title="No recommended action yet"
              description="Start a course or log some activity and this card will begin to personalize itself."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Due Soon"
          subtitle="Deadlines and pending work that should not slip."
          icon={AlertTriangle}
          action={
            <Link
              href="/student/assignments"
              className="text-sm font-semibold text-lumina-highlight hover:text-white transition-colors"
            >
              View all
            </Link>
          }
        >
          <div className="space-y-3">
            {dueAssignments.filter((item) => !item.submitted).slice(0, 4).length >
            0 ? (
              dueAssignments
                .filter((item) => !item.submitted)
                .slice(0, 4)
                .map((assignment) => (
                  <div
                    key={assignment.id}
                    className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <StatusPill tone={getAssignmentTone(assignment.status)}>
                          {formatAssignmentStatus(assignment)}
                        </StatusPill>
                        <StatusPill tone="neutral">
                          {assignment.courseName}
                        </StatusPill>
                      </div>
                      <h3 className="text-white font-semibold">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {formatDueDate(assignment.dueDate)}
                      </p>
                    </div>
                    <Link
                      href={assignment.href}
                      className="text-sm font-semibold text-lumina-highlight hover:text-white transition-colors shrink-0"
                    >
                      Open
                    </Link>
                  </div>
                ))
            ) : (
              <EmptyState
                title="No pending assignments"
                description="Your assignment queue is clear right now."
              />
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8">
        <SectionCard
          title="Activity Pulse"
          subtitle="Focused study minutes recorded over the last seven days."
          icon={TrendingUp}
        >
          <div className="h-80">
            <Line
              data={activityChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: "rgba(255, 255, 255, 0.04)" },
                    ticks: {
                      color: "rgba(255, 255, 255, 0.4)",
                      font: { size: 11 },
                    },
                  },
                  x: {
                    grid: { display: false },
                    ticks: {
                      color: "rgba(255, 255, 255, 0.4)",
                      font: { size: 11 },
                    },
                  },
                },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "rgba(10, 10, 10, 0.95)",
                    titleColor: "#fcc419",
                    bodyColor: "#fff",
                    borderColor: "rgba(252, 196, 25, 0.2)",
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 12,
                    displayColors: false,
                  },
                },
              }}
            />
          </div>
        </SectionCard>

      <SectionCard
        title="Today's Recommended Pathway"
        subtitle="AI-curated sequence optimized for your current cognitive load."
        icon={CheckCircle2}
      >
        <div className="relative mt-4 ml-4">
          {/* Vertical line connecting steps */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/5" />
          
          <div className="space-y-8 relative">
            {todayPlan.length > 0 ? (
              todayPlan.map((item, index) => (
                <div key={`${item.title}-${index}`} className="flex gap-8 group">
                  <div className={cn(
                    "w-8 h-8 rounded-full border flex items-center justify-center shrink-0 z-10 transition-all duration-500",
                    item.status === "completed" 
                      ? "bg-lumina-highlight/20 border-lumina-highlight/50 text-lumina-highlight" 
                      : index === 0 
                        ? "bg-lumina-highlight/10 border-lumina-highlight/30 text-lumina-highlight group-hover:scale-125 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                        : "bg-white/5 border-white/10 text-gray-400"
                  )}>
                    {item.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        index === 0 ? "bg-lumina-highlight animate-pulse" : "bg-gray-600"
                      )} />
                    )}
                  </div>
                  
                  <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-6 transition-all group-hover:bg-white/[0.04] group-hover:border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                      <h4 className="text-lg font-bold text-white group-hover:text-lumina-highlight transition-colors">
                        {item.title}
                      </h4>
                      <StatusPill tone={getPlanTone(item.status as any)}>
                        {normalizeLabel(item.status)}
                      </StatusPill>
                    </div>
                    <p className="text-sm text-gray-400 mb-6">{item.detail}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {item.kind === "assignment" ? "30m" : "15m"}
                        </div>
                        <Link
                          href={item.href}
                          className="text-xs font-black text-white hover:text-lumina-highlight flex items-center gap-1 uppercase tracking-widest transition-all"
                        >
                          Launch {normalizeLabel(item.kind)} <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="Your pathway is generating"
                description="We're analyzing your latest activity to build your optimal learning route."
              />
            )}
          </div>
        </div>
      </SectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <SectionCard
          title="Weak Topics"
          subtitle="Concepts that need reinforcement before you level up."
          icon={Brain}
        >
          <div className="space-y-4">
            {weakTopics.length > 0 ? (
              weakTopics.slice(0, 4).map((topic) => (
                <div key={topic.topic}>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div>
                      <p className="text-white font-semibold">{topic.topic}</p>
                      <p className="text-xs text-gray-400">
                        {topic.attempts} attempts, {roundValue(topic.confidence)}%
                        confidence
                      </p>
                    </div>
                    <StatusPill tone={getTopicTone(topic.status)}>
                      {normalizeLabel(topic.status)}
                    </StatusPill>
                  </div>
                  <ProgressBar value={topic.score} />
                </div>
              ))
            ) : (
              <EmptyState
                title="No weak topics detected"
                description="Once you build more interaction history, we will surface exact concepts that need support."
              />
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Resume Learning"
          subtitle="Jump back into the course with the strongest momentum."
          icon={BookOpen}
        >
          {resumeCourse ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-2xl font-display font-bold text-white">
                  {resumeCourse.title}
                </h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  {resumeCourse.description ||
                    "Continue the course you were last building momentum in."}
                </p>
              </div>
              <div className="space-y-4">
                <MetricRow
                  label="Course progress"
                  value={`${roundValue(resumeCourse.progress)}%`}
                />
                <ProgressBar value={resumeCourse.progress} />
                <div className="grid grid-cols-2 gap-4">
                  <MiniMetric
                    label="Mastery"
                    value={`${roundValue(resumeCourse.mastery)}%`}
                  />
                  <MiniMetric
                    label="Course streak"
                    value={`${resumeCourse.streak || 0} days`}
                  />
                </div>
              </div>
              <Link
                href={resumeCourse.href}
                className="h-12 px-5 rounded-2xl bg-white/[0.04] border border-white/10 text-white font-semibold inline-flex items-center gap-2 hover:border-lumina-highlight/30 hover:text-lumina-highlight transition-all"
              >
                Continue course
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <EmptyState
              title="No resume path yet"
              description="Enroll in a course and your resume card will appear here."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Learning Signals"
          subtitle="Behavior, risk, and engagement signals from your learner profile."
          icon={Target}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <MiniMetric
                label="Engagement"
                value={`${learningSignals?.engagementScore || 0}/100`}
              />
              <MiniMetric
                label="Recent average"
                value={`${roundValue(learningSignals?.recentAverageScore || 0)}%`}
              />
            </div>
            <div>
              <MetricRow
                label="Cognitive load"
                value={`${roundValue(learningSignals?.cognitiveLoad || 0)}%`}
              />
              <ProgressBar
                value={Math.min(100, learningSignals?.cognitiveLoad || 0)}
                tone={getLoadBarTone(learningSignals?.cognitiveLoad || 0)}
              />
            </div>
            <div>
              <MetricRow
                label="Risk score"
                value={`${roundValue(learningSignals?.riskScore || 0)}%`}
              />
              <ProgressBar
                value={Math.min(100, learningSignals?.riskScore || 0)}
                tone={getRiskBarTone(learningSignals?.riskLevel || "low")}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill tone="neutral">
                {normalizeLabel(learningSignals?.behaviorLabel || "neutral")}
              </StatusPill>
              <StatusPill
                tone={getRiskTone(learningSignals?.riskLevel || "low")}
              >
                {normalizeLabel(learningSignals?.riskLevel || "low")} risk
              </StatusPill>
            </div>
            {learningSignals?.reasons?.length ? (
              <ul className="space-y-2 text-sm text-gray-400">
                {learningSignals.reasons.slice(0, 3).map((reason) => (
                  <li key={reason} className="flex gap-2">
                    <span className="text-lumina-highlight">•</span>
                    <span>{capitalizeSentence(reason)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">
                No major risk signals are active right now.
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8">
        <SectionCard
          title="Mastery Pulse"
          subtitle="A concept-by-concept view of where your understanding currently stands."
          icon={TrendingUp}
        >
          <div className="space-y-4">
            {masteryBreakdown.length > 0 ? (
              masteryBreakdown.map((item) => (
                <div key={item.topic}>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div>
                      <p className="text-white font-semibold">{item.topic}</p>
                      <p className="text-xs text-gray-400">
                        Confidence {roundValue(item.confidence)}%
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-lumina-highlight">
                      {roundValue(item.score)}%
                    </span>
                  </div>
                  <ProgressBar value={item.score} tone={getTopicBarTone(item.status)} />
                </div>
              ))
            ) : (
              <EmptyState
                title="Mastery data is still building"
                description="Take quizzes and assessments to unlock concept-level mastery tracking."
              />
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Coach Insight"
          subtitle="A focused intervention cue generated from your recent behavior and performance."
          icon={Bot}
        >
          {coachInsight ? (
            <div className="space-y-5">
              <StatusPill tone={getPriorityTone(coachInsight.priority)}>
                {normalizeLabel(coachInsight.priority)} priority
              </StatusPill>
              <div>
                <h3 className="text-2xl font-display font-bold text-white">
                  {coachInsight.title}
                </h3>
                <p className="text-gray-400 mt-3 leading-relaxed">
                  {coachInsight.summary}
                </p>
              </div>
              <Link
                href={coachInsight.href}
                className="h-12 px-5 rounded-2xl bg-white/[0.04] border border-white/10 text-white font-semibold inline-flex items-center gap-2 hover:border-lumina-highlight/30 hover:text-lumina-highlight transition-all"
              >
                {coachInsight.actionLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <EmptyState
              title="No coach insight yet"
              description="As your learner profile matures, intervention suggestions will appear here."
            />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Continue Learning"
        subtitle="Your active courses, sorted for momentum rather than noise."
        icon={BookOpen}
        action={
          <Link
            href="/student/courses"
            className="text-sm font-semibold text-lumina-highlight hover:text-white transition-colors"
          >
            View all
          </Link>
        }
      >
        {enrolledCourses.length > 0 ? (
          <DashboardGrid columns={3}>
            {enrolledCourses.slice(0, 3).map((course) => (
              <div
                key={course.id}
                className="rounded-[28px] border border-white/5 bg-white/[0.02] overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-white/5 bg-surface-950/40">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <StatusPill tone="neutral">
                      {course.code || "Course"}
                    </StatusPill>
                    <StatusPill tone="accent">
                      {roundValue(course.mastery || 0)}% mastery
                    </StatusPill>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white line-clamp-2">
                    {course.name || course.title}
                  </h3>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <p className="text-sm text-gray-400 leading-relaxed line-clamp-3 flex-1">
                    {course.description || "Continue building momentum in this course."}
                  </p>
                  <div className="mt-6 space-y-3">
                    <MetricRow
                      label="Progress"
                      value={`${roundValue(course.progress || 0)}%`}
                    />
                    <ProgressBar value={course.progress || 0} />
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{course.streak || 0} day streak</span>
                      <span>{roundValue(course.mastery || 0)}% mastery</span>
                    </div>
                    <Link
                      href={`/student/courses/${course.id}`}
                      className="h-11 rounded-2xl bg-white/[0.04] border border-white/10 text-white font-semibold inline-flex items-center justify-center gap-2 hover:border-lumina-highlight/30 hover:text-lumina-highlight transition-all"
                    >
                      Continue course
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </DashboardGrid>
        ) : (
          <EmptyState
            title="No active courses"
            description="Explore the catalog to start your first personalized learning path."
            actionLabel="Browse catalog"
            href="/student/course_explorer"
          />
        )}
      </SectionCard>

      <SectionCard
        title="Achievement Snapshot"
        subtitle="A compact view of progress milestones without turning the dashboard into a trophy wall."
        icon={Trophy}
      >
        {achievementSummary ? (
          <div className="grid grid-cols-1 lg:grid-cols-[0.7fr_1.3fr] gap-6">
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
                Unlocked
              </p>
              <h3 className="text-5xl font-display font-bold text-white mt-3">
                {achievementSummary.unlockedCount}
              </h3>
              <p className="text-sm text-gray-400 mt-3">
                {achievementSummary.badgeCount} stored badges. Next milestone:{" "}
                <span className="text-white">
                  {achievementSummary.nextMilestone}
                </span>
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {achievementSummary.highlights.map((item) => (
                <div
                  key={item.title}
                  className={cn(
                    "rounded-3xl border p-5",
                    item.completed
                      ? "border-lumina-highlight/20 bg-lumina-highlight/[0.08]"
                      : "border-white/5 bg-white/[0.02]",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-white font-semibold">{item.title}</p>
                    <StatusPill tone={item.completed ? "accent" : "neutral"}>
                      {item.completed ? "Unlocked" : "In progress"}
                    </StatusPill>
                  </div>
                  <p className="text-sm text-gray-400 mt-3">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="Achievement tracking is quiet"
            description="Milestones will appear here once you build streaks, mastery, and course completions."
          />
        )}
      </SectionCard>

      {/* Global AI Tutor Quick-Access (Floating/Fixed) */}
      <div className="fixed bottom-8 right-8 z-[100] group">
        <div className="absolute inset-0 bg-lumina-highlight/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <Link
          href="/student/ai_tutor"
          className="relative h-16 w-16 md:h-20 md:w-20 rounded-full bg-lumina-highlight text-black flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300"
        >
          <Bot className="w-8 h-8 md:w-10 md:h-10" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-lumina-highlight rounded-full border-2 border-slate-900" />
          
          {/* Tooltip */}
          <div className="absolute right-full mr-4 px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-bold whitespace-nowrap opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none">
            Launch AI Tutor
          </div>
        </Link>
      </div>
    </div>
  );
}

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

function roundValue(value: number) {
  return Math.round((value || 0) * 10) / 10;
}

function normalizeLabel(value: string) {
  return value.replace(/_/g, " ");
}

function capitalizeSentence(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getPriorityTone(priority: DashboardPriority) {
  if (priority === "critical") return "danger";
  if (priority === "high") return "warning";
  if (priority === "medium") return "accent";
  return "neutral";
}

function getRiskTone(riskLevel: string) {
  if (riskLevel === "critical" || riskLevel === "high") return "danger";
  if (riskLevel === "medium") return "warning";
  return "neutral";
}

function getPlanTone(status: StudyPlanItem["status"]) {
  if (status === "urgent") return "danger";
  if (status === "focus") return "warning";
  if (status === "recommended") return "accent";
  if (status === "completed") return "success";
  return "neutral";
}

function getTopicTone(status: WeakTopic["status"]) {
  if (status === "urgent") return "danger";
  if (status === "developing") return "warning";
  return "success";
}

function getAssignmentTone(status: DueAssignment["status"]) {
  if (status === "overdue") return "danger";
  if (status === "due_soon") return "warning";
  if (status === "submitted") return "success";
  return "neutral";
}

function getLoadBarTone(value: number) {
  if (value >= 75) return "from-red-500 to-amber-400";
  if (value >= 50) return "from-amber-400 to-lumina-primary";
  return "from-amber-300 to-lumina-primary";
}

function getRiskBarTone(riskLevel: string) {
  if (riskLevel === "critical" || riskLevel === "high") {
    return "from-red-500 to-amber-400";
  }
  if (riskLevel === "medium") {
    return "from-amber-400 to-yellow-300";
  }
  return "from-amber-300 to-lumina-primary";
}

function getTopicBarTone(status: WeakTopic["status"]) {
  if (status === "urgent") return "from-red-500 to-amber-400";
  if (status === "developing") return "from-amber-400 to-yellow-300";
  return "from-yellow-400 to-lumina-primary";
}

function formatDueDate(value?: string) {
  if (!value) return "No due date set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date set";
  return `Due ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

function formatAssignmentStatus(assignment: DueAssignment) {
  if (assignment.status === "overdue") return "Overdue";
  if (assignment.status === "due_soon") {
    if (assignment.daysRemaining === 0) return "Due today";
    if (assignment.daysRemaining === 1) return "Due tomorrow";
    return "Due soon";
  }
  return "Pending";
}
