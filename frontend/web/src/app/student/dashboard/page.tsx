"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Line } from "react-chartjs-2";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
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
  status: "urgent" | "planned" | "focus" | "recommended";
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
    <section className={cn("glass-v2 border-white/5 overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-4 p-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center justify-center text-lumina-primary">
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
          borderColor: "#FFD700",
          backgroundColor: "rgba(255, 215, 0, 0.12)",
          fill: true,
          tension: 0.35,
          pointBackgroundColor: "#FFD700",
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
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <StatusPill tone="accent">
              {normalizeLabel(learningSignals?.behaviorLabel || "steady")} mode
            </StatusPill>
            <StatusPill
              tone={getRiskTone(learningSignals?.riskLevel || "low")}
            >
              Risk {normalizeLabel(learningSignals?.riskLevel || "low")}
            </StatusPill>
            <StatusPill tone="neutral">
              {dashboardData?.pendingAssignments || 0} pending tasks
            </StatusPill>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white">
            Welcome back,{" "}
            <span className="gradient-text">
              {dashboardData?.studentName || "Scholar"}
            </span>
          </h1>
          <p className="text-gray-400 text-lg mt-3 max-w-2xl leading-relaxed">
            Your dashboard is now centered on what matters most: the next action
            to take, the concepts that need support, and the work that is coming
            due.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={nextAction?.href || "/student/ai_tutor"}
            className="h-12 px-5 rounded-2xl bg-lumina-primary text-black font-semibold inline-flex items-center gap-2 hover:brightness-110 transition-all shadow-gold-glow"
          >
            {nextAction?.ctaLabel || "Open tutor"}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/student/course_explorer"
            className="h-12 px-5 rounded-2xl border border-white/10 text-white font-semibold inline-flex items-center gap-2 hover:border-lumina-primary/30 hover:text-lumina-primary transition-all"
          >
            Explore Catalog
          </Link>
        </div>
      </div>

      <DashboardGrid columns={4}>
        <StatCard
          title="Current Streak"
          value={dashboardData?.currentStreak || 0}
          subtitle="Days in a row"
          icon={Flame}
          color="gold"
        />
        <StatCard
          title="Pending Work"
          value={dashboardData?.pendingAssignments || 0}
          subtitle="Assignments to close"
          icon={CalendarClock}
          color="purple"
        />
        <StatCard
          title="Weekly Focus"
          value={`${roundValue(dashboardData?.weeklyMinutes || 0)}m`}
          subtitle="Focused minutes logged"
          icon={Clock3}
          color="green"
        />
        <StatCard
          title="Overall Mastery"
          value={`${roundValue(dashboardData?.overallMastery || 0)}%`}
          subtitle="Across active courses"
          icon={Target}
          color="blue"
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
                className="h-12 px-5 rounded-2xl bg-white/[0.04] border border-white/10 text-white font-semibold inline-flex items-center gap-2 hover:border-lumina-primary/30 hover:text-lumina-primary transition-all"
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
              className="text-sm font-semibold text-lumina-primary hover:text-white transition-colors"
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
                      className="text-sm font-semibold text-lumina-primary hover:text-white transition-colors shrink-0"
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
                    titleColor: "#FFD700",
                    bodyColor: "#fff",
                    borderColor: "rgba(255, 215, 0, 0.2)",
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
          title="Today's Study Plan"
          subtitle="A focused task queue built from weak topics, pending work, and course momentum."
          icon={CheckCircle2}
        >
          <div className="space-y-3">
            {todayPlan.length > 0 ? (
              todayPlan.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <StatusPill tone={getPlanTone(item.status)}>
                          {normalizeLabel(item.status)}
                        </StatusPill>
                        <StatusPill tone="neutral">
                          {normalizeLabel(item.kind)}
                        </StatusPill>
                      </div>
                      <h3 className="text-white font-semibold">{item.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {item.detail}
                      </p>
                    </div>
                    <Link
                      href={item.href}
                      className="text-sm font-semibold text-lumina-primary hover:text-white transition-colors shrink-0"
                    >
                      {item.ctaLabel}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No study plan yet"
                description="Complete a quiz, lesson, or assignment and your plan will begin to adapt."
              />
            )}
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
                className="h-12 px-5 rounded-2xl bg-white/[0.04] border border-white/10 text-white font-semibold inline-flex items-center gap-2 hover:border-lumina-primary/30 hover:text-lumina-primary transition-all"
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
                    <span className="text-lumina-primary">•</span>
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
                    <span className="text-sm font-semibold text-lumina-primary">
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
                className="h-12 px-5 rounded-2xl bg-white/[0.04] border border-white/10 text-white font-semibold inline-flex items-center gap-2 hover:border-lumina-primary/30 hover:text-lumina-primary transition-all"
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
            className="text-sm font-semibold text-lumina-primary hover:text-white transition-colors"
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
                      className="h-11 rounded-2xl bg-white/[0.04] border border-white/10 text-white font-semibold inline-flex items-center justify-center gap-2 hover:border-lumina-primary/30 hover:text-lumina-primary transition-all"
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
                      ? "border-lumina-primary/20 bg-lumina-primary/[0.08]"
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
    </div>
  );
}

function ProgressBar({
  value,
  tone = "from-lumina-primary to-amber-400",
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
          className="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-lumina-primary hover:text-white transition-colors"
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
    accent: "bg-lumina-primary/10 text-lumina-primary border-lumina-primary/20",
    neutral: "bg-white/[0.04] text-gray-300 border-white/10",
    success: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
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
  if (value >= 75) return "from-red-500 to-orange-400";
  if (value >= 50) return "from-amber-400 to-lumina-primary";
  return "from-emerald-400 to-lumina-primary";
}

function getRiskBarTone(riskLevel: string) {
  if (riskLevel === "critical" || riskLevel === "high") {
    return "from-red-500 to-orange-400";
  }
  if (riskLevel === "medium") {
    return "from-amber-400 to-yellow-300";
  }
  return "from-emerald-400 to-lumina-primary";
}

function getTopicBarTone(status: WeakTopic["status"]) {
  if (status === "urgent") return "from-red-500 to-orange-400";
  if (status === "developing") return "from-amber-400 to-yellow-300";
  return "from-emerald-400 to-lumina-primary";
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
