"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Trophy,
  Flame,
  Target,
  TrendingUp,
  BookOpen,
  Clock,
  Award,
  AlertTriangle,
  Brain,
  ArrowRight,
} from "lucide-react";

type ProgressData = {
  stats?: {
    currentStreak?: number;
    totalXP?: number;
    avgAccuracy?: number;
    learningTime?: string;
  };
  weeklyActivityDetail?: Array<{
    label: string;
    minutes: number;
    interactions: number;
  }>;
  recentCourses?: Array<{
    id: string;
    courseName: string;
    progress: number;
    mastery: number;
    streak: number;
  }>;
  achievements?: Array<{
    title: string;
    desc: string;
    unlocked: boolean;
  }>;
  weakTopics?: Array<{
    topic: string;
    score: number;
    confidence: number;
    status: string;
  }>;
  dueAssignments?: Array<{
    id: string;
    title: string;
    courseName: string;
    status: string;
    daysRemaining: number | null;
  }>;
  coachInsight?: {
    title: string;
    summary: string;
    actionLabel: string;
    href: string;
    priority: string;
  } | null;
  learningSignals?: {
    behaviorLabel?: string;
    cognitiveLoad?: number;
    engagementScore?: number;
    riskLevel?: string;
    riskScore?: number;
    recentAverageScore?: number;
  };
  nextAction?: {
    title: string;
    description: string;
    ctaLabel: string;
    href: string;
  } | null;
  masteryBreakdown?: Array<{
    topic: string;
    score: number;
    confidence: number;
    status: string;
  }>;
};

export default function StudentProgress() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setData(await api.getStudentProgress());
      } finally {
        setIsLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (isLoading) {
    return <div className="text-white text-center p-10">Loading progress...</div>;
  }

  const stats = data?.stats || {};
  const weekly = data?.weeklyActivityDetail || [];
  const maxMinutes = Math.max(...weekly.map((item) => item.minutes), 1);
  const dueAssignments = data?.dueAssignments || [];
  const weakTopics = data?.weakTopics || [];
  const masteryBreakdown = data?.masteryBreakdown || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Learning Progress</h1>
          <p className="text-gray-400">
            Deep view of your momentum, weak concepts, and next interventions.
          </p>
        </div>
        {data?.nextAction && (
          <Link
            href={data.nextAction.href}
            className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-xl bg-lumina-primary text-black font-semibold hover:bg-lumina-secondary transition-colors"
          >
            {data.nextAction.ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Flame className="w-6 h-6 text-amber-500" />}
          label="Current Streak"
          value={`${stats.currentStreak || 0} Days`}
          hint="Consistency drives retention"
        />
        <StatCard
          icon={<Trophy className="w-6 h-6 text-blue-500" />}
          label="Learning XP"
          value={String(stats.totalXP || 0)}
          hint="Built from milestones and mastery"
        />
        <StatCard
          icon={<Target className="w-6 h-6 text-purple-500" />}
          label="Average Accuracy"
          value={`${stats.avgAccuracy || 0}%`}
          hint="Recent mastery performance"
        />
        <StatCard
          icon={<Clock className="w-6 h-6 text-emerald-500" />}
          label="Study Time"
          value={stats.learningTime || "0h 0m"}
          hint="This week"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-lumina-primary" />
              Weekly Activity
            </h2>
            {weekly.length > 0 ? (
              <>
                <div className="h-64 bg-white/5 rounded-xl flex items-end justify-between p-4 gap-2">
                  {weekly.map((item) => (
                    <div
                      key={item.label}
                      className="w-full bg-lumina-primary/20 hover:bg-lumina-primary/40 rounded-t-lg transition-all relative group"
                      style={{
                        height: `${Math.max(10, (item.minutes / maxMinutes) * 100)}%`,
                      }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                        {Math.round(item.minutes)}m • {item.interactions} actions
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-sm text-gray-400">
                  {weekly.map((item) => (
                    <span key={item.label}>{item.label}</span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500">No activity logged yet.</p>
            )}
          </section>

          <section className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-lumina-primary" />
              Course Momentum
            </h2>
            <div className="space-y-4">
              {(data?.recentCourses || []).length > 0 ? (
                data?.recentCourses?.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-white font-medium">{course.courseName}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Mastery {course.mastery}% • Streak {course.streak} days
                        </p>
                      </div>
                      <Link
                        href={`/student/courses/${course.id}`}
                        className="text-sm text-lumina-primary hover:underline"
                      >
                        Open
                      </Link>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Completion</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-lumina-primary rounded-full"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No enrolled courses yet.</p>
              )}
            </div>
          </section>

          <section className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Brain className="w-5 h-5 text-lumina-primary" />
              Mastery Breakdown
            </h2>
            <div className="space-y-4">
              {masteryBreakdown.length > 0 ? (
                masteryBreakdown.map((item) => (
                  <div key={item.topic} className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-white font-medium capitalize">{item.topic}</p>
                        <p className="text-xs text-gray-400">
                          Confidence {Math.round(item.confidence)}% • {item.status}
                        </p>
                      </div>
                      <span className="text-sm text-gray-300">{Math.round(item.score)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.score < 45
                            ? "bg-red-500"
                            : item.score < 70
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.max(4, item.score)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No mastery signals available yet.</p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-5 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Weak Topics
            </h2>
            <div className="space-y-3">
              {weakTopics.length > 0 ? (
                weakTopics.map((topic) => (
                  <div
                    key={topic.topic}
                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-white font-medium capitalize">{topic.topic}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          topic.status === "urgent"
                            ? "bg-red-500/15 text-red-400"
                            : topic.status === "developing"
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-emerald-500/15 text-emerald-400"
                        }`}
                      >
                        {topic.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      Score {Math.round(topic.score)}% • Confidence {Math.round(topic.confidence)}%
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No weak topics detected.</p>
              )}
            </div>
          </section>

          <section className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-5 flex items-center gap-2">
              <Award className="w-5 h-5 text-lumina-primary" />
              Achievement Snapshot
            </h2>
            <div className="space-y-3">
              {(data?.achievements || []).length > 0 ? (
                data?.achievements?.map((achievement) => (
                  <div
                    key={achievement.title}
                    className={`p-4 rounded-xl border ${
                      achievement.unlocked
                        ? "bg-white/5 border-white/10"
                        : "bg-white/[0.02] border-white/5"
                    }`}
                  >
                    <p className="text-white font-medium">{achievement.title}</p>
                    <p className="text-sm text-gray-400 mt-1">{achievement.desc}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No achievement data yet.</p>
              )}
            </div>
          </section>

          <section className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-5">Learning Signals</h2>
            <div className="space-y-4 text-sm">
              <SignalRow
                label="Behavior"
                value={data?.learningSignals?.behaviorLabel || "neutral"}
              />
              <SignalRow
                label="Cognitive Load"
                value={`${Math.round(data?.learningSignals?.cognitiveLoad || 0)} / 100`}
              />
              <SignalRow
                label="Engagement"
                value={`${Math.round(data?.learningSignals?.engagementScore || 0)} / 100`}
              />
              <SignalRow
                label="Risk Level"
                value={`${data?.learningSignals?.riskLevel || "low"} (${Math.round(
                  data?.learningSignals?.riskScore || 0,
                )}%)`}
              />
            </div>
          </section>

          <section className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-5">Due Assignments</h2>
            <div className="space-y-3">
              {dueAssignments.length > 0 ? (
                dueAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <p className="text-white font-medium">{assignment.title}</p>
                    <p className="text-sm text-gray-400 mt-1">{assignment.courseName}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {assignment.status.replace("_", " ")}
                      {assignment.daysRemaining !== null
                        ? ` • ${assignment.daysRemaining} days remaining`
                        : ""}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No pending assignments.</p>
              )}
            </div>
          </section>

          {data?.coachInsight && (
            <section className="glass-card p-6 border border-lumina-primary/20">
              <h2 className="text-xl font-semibold text-white mb-3">
                {data.coachInsight.title}
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                {data.coachInsight.summary}
              </p>
              <Link
                href={data.coachInsight.href}
                className="inline-flex items-center gap-2 mt-4 text-lumina-primary hover:underline"
              >
                {data.coachInsight.actionLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500">{hint}</p>
      </div>
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-400">{label}</span>
      <span className="text-white capitalize">{value}</span>
    </div>
  );
}
