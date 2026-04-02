"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Brain,
  BookOpen,
  Flame,
  Clock,
  TrendingUp,
  BarChart2,
  Calendar,
  Zap,
} from "lucide-react";
import { getConfiguredApiBase } from "@/lib/api";
import { cn } from "@/lib/utils";

// --- Types ---

type SubjectReadiness = {
  subject: string;
  readiness: number; // 0-100
  weakTopics: string[];
  status: "strong" | "moderate" | "weak";
};

type ExamReadinessData = {
  overallScore: number;        // predicted exam score %
  readinessLevel: "ready" | "on_track" | "at_risk" | "critical";
  daysToExam: number | null;
  subjects: SubjectReadiness[];
  topWeakTopics: Array<{ topic: string; score: number; priority: "high" | "medium" | "low" }>;
  studyHoursNeeded: number;
  studyHoursCompleted: number;
  aiRecommendations: string[];
  lastUpdated: string;
};

const MOCK_DATA: ExamReadinessData = {
  overallScore: 72,
  readinessLevel: "on_track",
  daysToExam: 18,
  subjects: [
    { subject: "Mathematics", readiness: 85, weakTopics: ["Integration", "Matrices"], status: "strong" },
    { subject: "Physics", readiness: 68, weakTopics: ["Electromagnetism", "Optics"], status: "moderate" },
    { subject: "Chemistry", readiness: 55, weakTopics: ["Organic Reactions", "Electrochemistry"], status: "weak" },
    { subject: "Biology", readiness: 78, weakTopics: ["Genetics", "Ecology"], status: "moderate" },
    { subject: "English", readiness: 90, weakTopics: [], status: "strong" },
  ],
  topWeakTopics: [
    { topic: "Organic Reactions", score: 32, priority: "high" },
    { topic: "Electrochemistry", score: 41, priority: "high" },
    { topic: "Electromagnetism", score: 48, priority: "high" },
    { topic: "Integration", score: 55, priority: "medium" },
    { topic: "Genetics", score: 60, priority: "medium" },
  ],
  studyHoursNeeded: 40,
  studyHoursCompleted: 22,
  aiRecommendations: [
    "Dedicate 2 hours daily to Chemistry — Organic Reactions are your biggest gap before the exam.",
    "Practice 10 Physics numericals per day focusing on Electromagnetism to close the gap.",
    "Your Mathematics is strong — 30 minutes of daily review is sufficient to maintain it.",
    "Use spaced repetition for Biology Genetics — you're close to mastery here.",
  ],
  lastUpdated: new Date().toLocaleDateString(),
};

export default function ExamReadinessPage() {
  const [data, setData] = useState<ExamReadinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const apiBase = getConfiguredApiBase();
        if (apiBase) {
          const res = await fetch(`${apiBase}/api/student/exam-readiness`, {
            credentials: "include",
          });
          if (res.ok) {
            setData(await res.json());
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // fall through to mock
      }
      setData(MOCK_DATA);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lumina-highlight" />
      </div>
    );
  }

  if (!data) return null;

  const readinessConfig = {
    ready: { label: "Exam Ready", color: "text-lumina-highlight", bg: "bg-lumina-highlight/10 border-lumina-highlight/20", icon: <CheckCircle className="w-5 h-5" /> },
    on_track: { label: "On Track", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: <TrendingUp className="w-5 h-5" /> },
    at_risk: { label: "At Risk", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", icon: <AlertTriangle className="w-5 h-5" /> },
    critical: { label: "Critical", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: <AlertTriangle className="w-5 h-5" /> },
  }[data.readinessLevel];

  const studyProgress = Math.round((data.studyHoursCompleted / data.studyHoursNeeded) * 100);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <Target className="w-8 h-8 text-lumina-highlight" />
            Exam Readiness
          </h1>
          <p className="text-gray-400">
            AI-powered prediction of your exam performance based on mastery signals and engagement.
          </p>
        </div>
        <p className="text-xs text-gray-500 shrink-0">Updated: {data.lastUpdated}</p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Predicted score — hero metric */}
        <div className="md:col-span-1 glass-v2-gold border-white/5 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-3">Predicted Score</p>
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 44 * data.overallScore / 100} ${2 * Math.PI * 44}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-display font-black text-white">{data.overallScore}%</span>
            </div>
          </div>
          <div className={cn("mt-4 flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold", readinessConfig.bg, readinessConfig.color)}>
            {readinessConfig.icon}
            {readinessConfig.label}
          </div>
        </div>

        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            icon={<Calendar className="w-5 h-5 text-amber-400" />}
            label="Days to Exam"
            value={data.daysToExam !== null ? `${data.daysToExam} days` : "TBD"}
            sub={data.daysToExam !== null && data.daysToExam <= 7 ? "⚠ Final stretch!" : "Stay consistent"}
          />
          <MetricCard
            icon={<Clock className="w-5 h-5 text-lumina-highlight" />}
            label="Study Hours"
            value={`${data.studyHoursCompleted} / ${data.studyHoursNeeded}h`}
            sub={`${studyProgress}% of target`}
            progress={studyProgress}
          />
          <MetricCard
            icon={<Flame className="w-5 h-5 text-orange-400" />}
            label="Weak Areas"
            value={String(data.topWeakTopics.filter((t) => t.priority === "high").length)}
            sub="High-priority topics"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        <div className="space-y-6">
          {/* Subject Readiness */}
          <section className="glass-v2-gold border-white/5 rounded-[2rem] overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-lumina-highlight" />
                Subject Readiness Breakdown
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {data.subjects.map((sub) => {
                const barColor =
                  sub.status === "strong"
                    ? "from-lumina-highlight to-amber-400"
                    : sub.status === "moderate"
                      ? "from-amber-500 to-orange-400"
                      : "from-red-500 to-red-400";
                return (
                  <div key={sub.subject} className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{sub.subject}</span>
                        {sub.status === "strong" && <CheckCircle className="w-4 h-4 text-lumina-highlight" />}
                        {sub.status === "weak" && <AlertTriangle className="w-4 h-4 text-red-400" />}
                      </div>
                      <span className="text-sm font-bold text-gray-300">{sub.readiness}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", barColor)}
                        style={{ width: `${sub.readiness}%` }}
                      />
                    </div>
                    {sub.weakTopics.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Focus: {sub.weakTopics.join(", ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* AI Recommendations */}
          <section className="glass-v2-gold border-white/5 rounded-[2rem] overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-lumina-highlight" />
                AI Study Recommendations
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {data.aiRecommendations.map((rec, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="w-6 h-6 rounded-full bg-lumina-highlight/10 border border-lumina-highlight/20 flex items-center justify-center text-lumina-highlight text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
            <div className="p-6 pt-0">
              <Link
                href="/student/ai_tutor"
                className="h-11 w-full rounded-2xl bg-lumina-highlight/10 border border-lumina-highlight/20 text-lumina-highlight font-bold inline-flex items-center justify-center gap-2 hover:bg-lumina-highlight/20 transition-all text-sm"
              >
                Ask AI Tutor for Personalised Plan
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Top Weak Topics */}
          <section className="glass-v2-gold border-white/5 rounded-[2rem] overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Priority Weak Topics
              </h2>
            </div>
            <div className="p-6 space-y-3">
              {data.topWeakTopics.map((topic) => {
                const priorityConfig = {
                  high: "bg-red-500/10 text-red-400 border-red-500/20",
                  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                  low: "bg-white/5 text-gray-400 border-white/10",
                }[topic.priority];
                return (
                  <div key={topic.topic} className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div>
                      <p className="text-white font-medium text-sm">{topic.topic}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Score: {topic.score}%</p>
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border", priorityConfig)}>
                      {topic.priority}
                    </span>
                  </div>
                );
              })}
              <Link
                href="/student/progress/knowledge-graph"
                className="flex items-center justify-center gap-2 mt-2 text-xs font-bold text-lumina-highlight hover:underline"
              >
                View Full Knowledge Graph
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="glass-v2-gold border-white/5 rounded-[2rem] overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-lumina-highlight" />
                Quick Actions
              </h2>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: "Start Daily Revision", href: "/student/spaced_repetition", icon: <BookOpen className="w-4 h-4" /> },
                { label: "Take Practice Assessment", href: "/student/assessment", icon: <Brain className="w-4 h-4" /> },
                { label: "View My Progress", href: "/student/progress", icon: <TrendingUp className="w-4 h-4" /> },
                { label: "Browse Courses", href: "/student/courses", icon: <BookOpen className="w-4 h-4" /> },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                    <span className="text-lumina-highlight">{action.icon}</span>
                    {action.label}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-lumina-highlight group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  progress?: number;
}) {
  return (
    <div className="glass-v2-gold border-white/5 rounded-[2rem] p-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">{icon}</div>
        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{label}</p>
      </div>
      <p className="text-2xl font-display font-bold text-white mb-1">{value}</p>
      {progress !== undefined && (
        <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-1">
          <div
            className="h-full bg-gradient-to-r from-lumina-highlight to-amber-400 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  );
}
