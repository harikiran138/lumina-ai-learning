"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  Square,
  Users,
  MessageSquare,
  BarChart3,
  CheckCircle,
  Plus,
  Zap,
  Timer,
  Eye,
  ThumbsUp,
  HelpCircle,
  ArrowRight,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SessionStatus = "idle" | "live" | "ended";
type QuizStatus = "draft" | "active" | "closed";

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  votes: number;
}

interface LiveQuiz {
  id: string;
  question: string;
  options: QuizOption[];
  status: QuizStatus;
  totalResponses: number;
  timeLimit: number;
  secondsLeft: number;
}

interface AnonQuestion {
  id: string;
  text: string;
  votes: number;
  answered: boolean;
  askedAt: string;
}

interface EngagementMetric {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
}

const MOCK_QUIZZES: LiveQuiz[] = [
  {
    id: "lq1",
    question: "Which of the following is NOT a supervised learning algorithm?",
    options: [
      { id: "a", text: "Linear Regression", isCorrect: false, votes: 8 },
      { id: "b", text: "K-Means Clustering", isCorrect: true, votes: 14 },
      { id: "c", text: "Decision Tree", isCorrect: false, votes: 4 },
      { id: "d", text: "Random Forest", isCorrect: false, votes: 2 },
    ],
    status: "closed",
    totalResponses: 28,
    timeLimit: 60,
    secondsLeft: 0,
  },
  {
    id: "lq2",
    question: "What does the learning rate control in gradient descent?",
    options: [
      { id: "a", text: "The number of epochs", isCorrect: false, votes: 0 },
      { id: "b", text: "The step size at each iteration", isCorrect: true, votes: 0 },
      { id: "c", text: "The size of the training batch", isCorrect: false, votes: 0 },
      { id: "d", text: "The depth of the neural network", isCorrect: false, votes: 0 },
    ],
    status: "draft",
    totalResponses: 0,
    timeLimit: 45,
    secondsLeft: 45,
  },
];

const MOCK_QUESTIONS: AnonQuestion[] = [
  {
    id: "aq1",
    text: "Can gradient descent get stuck in a local minimum?",
    votes: 7,
    answered: false,
    askedAt: "2 min ago",
  },
  {
    id: "aq2",
    text: "Is there a difference between batch and mini-batch gradient descent?",
    votes: 5,
    answered: false,
    askedAt: "5 min ago",
  },
  {
    id: "aq3",
    text: "When should we use L1 vs L2 regularization?",
    votes: 3,
    answered: true,
    askedAt: "12 min ago",
  },
];

const ENGAGEMENT_METRICS: EngagementMetric[] = [
  { label: "Students Joined", value: 31, trend: "up" },
  { label: "Active Right Now", value: 28 },
  { label: "Quiz Responses", value: "28/31", trend: "up" },
  { label: "Anon Questions", value: 3 },
  { label: "Avg Engagement", value: "87%", trend: "up" },
];

export default function LiveClassPage() {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [quizzes, setQuizzes] = useState<LiveQuiz[]>(MOCK_QUIZZES);
  const [anonQuestions, setAnonQuestions] = useState<AnonQuestion[]>(MOCK_QUESTIONS);
  const [sessionMinutes, setSessionMinutes] = useState(0);

  const startSession = () => {
    setSessionStatus("live");
    setSessionMinutes(0);
  };

  const endSession = () => {
    setSessionStatus("ended");
  };

  const launchQuiz = (id: string) => {
    setQuizzes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: "active" } : q)),
    );
  };

  const closeQuiz = (id: string) => {
    setQuizzes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: "closed" } : q)),
    );
  };

  const markAnswered = (id: string) => {
    setAnonQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, answered: true } : q)),
    );
  };

  const unanswered = anonQuestions.filter((q) => !q.answered);
  const activeQuiz = quizzes.find((q) => q.status === "active");

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="p-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">
            Real-Time Teaching
          </p>
          <h1 className="text-4xl font-display font-bold tracking-tight text-white md:text-5xl">
            Live Class{" "}
            <span className="text-lumina-highlight border-b-4 border-lumina-highlight/30">
              Control Center
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-400 leading-relaxed">
            Launch live sessions, run instant quizzes, collect anonymous student
            questions, and monitor real-time engagement — all from one view.
          </p>

          {/* Session controls */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {sessionStatus === "idle" && (
              <button
                onClick={startSession}
                className="inline-flex items-center gap-2 rounded-xl border border-lumina-highlight/30 bg-lumina-highlight/10 px-6 py-3 text-sm font-bold text-lumina-highlight hover:bg-lumina-highlight/20 transition-colors"
              >
                <Radio className="h-4 w-4" />
                Start Live Session
              </button>
            )}
            {sessionStatus === "live" && (
              <>
                <div className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">
                  <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                  LIVE
                </div>
                <button
                  onClick={endSession}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                >
                  <Square className="h-4 w-4" />
                  End Session
                </button>
              </>
            )}
            {sessionStatus === "ended" && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-400">
                <CheckCircle className="h-4 w-4 text-lumina-highlight" />
                Session ended — data saved to analytics
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Engagement metrics */}
      <div className="grid gap-4 md:grid-cols-5">
        {ENGAGEMENT_METRICS.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">{m.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{m.value}</p>
            {m.trend === "up" && (
              <p className="mt-1 text-xs text-lumina-highlight">Trending up</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        {/* Live Quizzes */}
        <section className="glass-v2 border-white/5 overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 p-6">
            <div>
              <h2 className="text-lg font-display font-bold text-white">Live Quizzes</h2>
              <p className="mt-1 text-sm text-gray-400">
                Launch instant polls and check comprehension in real time.
              </p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors">
              <Plus className="h-3.5 w-3.5" />
              New Quiz
            </button>
          </div>
          <div className="space-y-4 p-6">
            {activeQuiz && (
              <div className="rounded-2xl border border-red-400/20 bg-red-400/5 px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">
                    Quiz Active
                  </p>
                </div>
                <p className="text-sm font-semibold text-white mb-3">
                  {activeQuiz.question}
                </p>
                <div className="space-y-2 mb-4">
                  {activeQuiz.options.map((opt) => {
                    const pct =
                      activeQuiz.totalResponses > 0
                        ? Math.round((opt.votes / activeQuiz.totalResponses) * 100)
                        : 0;
                    return (
                      <div key={opt.id} className="flex items-center gap-3">
                        <div className="flex-1 h-6 rounded-full bg-white/10 overflow-hidden relative">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              opt.isCorrect
                                ? "bg-lumina-highlight/40"
                                : "bg-white/20",
                            )}
                            style={{ width: `${pct}%` }}
                          />
                          <span className="absolute inset-0 flex items-center px-3 text-xs text-white">
                            {opt.text}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 w-8 text-right">
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => closeQuiz(activeQuiz.id)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  Close Quiz
                </button>
              </div>
            )}

            {quizzes.map((quiz) => {
              if (quiz.status === "active") return null;
              return (
                <div
                  key={quiz.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <p className="text-sm font-semibold text-white flex-1">
                      {quiz.question}
                    </p>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] shrink-0",
                        quiz.status === "closed"
                          ? "border-white/10 text-gray-500"
                          : "border-amber-400/20 text-amber-300",
                      )}
                    >
                      {quiz.status}
                    </span>
                  </div>
                  {quiz.status === "closed" && quiz.totalResponses > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {quiz.options.map((opt) => {
                        const pct = Math.round((opt.votes / quiz.totalResponses) * 100);
                        return (
                          <div key={opt.id} className="flex items-center gap-3">
                            <div className="flex-1 h-5 rounded-full bg-white/10 overflow-hidden relative">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  opt.isCorrect
                                    ? "bg-lumina-highlight/30"
                                    : "bg-white/15",
                                )}
                                style={{ width: `${pct}%` }}
                              />
                              <span className="absolute inset-0 flex items-center px-3 text-[11px] text-gray-300">
                                {opt.text}
                                {opt.isCorrect && (
                                  <CheckCircle className="ml-1 h-3 w-3 text-lumina-highlight" />
                                )}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 w-8 text-right">
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                      <p className="text-xs text-gray-500 pt-1">
                        {quiz.totalResponses} responses
                      </p>
                    </div>
                  )}
                  {quiz.status === "draft" && (
                    <button
                      onClick={() => launchQuiz(quiz.id)}
                      disabled={sessionStatus !== "live"}
                      className="inline-flex items-center gap-2 rounded-xl border border-lumina-highlight/30 bg-lumina-highlight/10 px-3 py-1.5 text-xs font-semibold text-lumina-highlight hover:bg-lumina-highlight/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Play className="h-3.5 w-3.5" />
                      {sessionStatus !== "live" ? "Start session first" : "Launch Quiz"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Anonymous questions */}
        <section className="glass-v2 border-white/5 overflow-hidden">
          <div className="border-b border-white/5 p-6">
            <h2 className="text-lg font-display font-bold text-white">
              Anonymous Questions
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Students can ask questions anonymously. Upvoted questions surface
              to the top.
            </p>
          </div>
          <div className="space-y-3 p-6">
            {unanswered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center">
                <HelpCircle className="mx-auto mb-3 h-8 w-8 text-gray-500" />
                <p className="text-sm text-gray-400">No unanswered questions</p>
              </div>
            ) : (
              unanswered
                .sort((a, b) => b.votes - a.votes)
                .map((q) => (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <p className="text-sm text-white mb-2">{q.text}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {q.votes} votes
                        </span>
                        <span>{q.askedAt}</span>
                      </div>
                      <button
                        onClick={() => markAnswered(q.id)}
                        className="rounded-full border border-lumina-highlight/20 bg-lumina-highlight/5 px-3 py-1 text-[10px] font-semibold text-lumina-highlight hover:bg-lumina-highlight/10 transition-colors"
                      >
                        Mark Answered
                      </button>
                    </div>
                  </div>
                ))
            )}

            {anonQuestions.filter((q) => q.answered).length > 0 && (
              <div className="pt-2">
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gray-600">
                  Answered
                </p>
                {anonQuestions
                  .filter((q) => q.answered)
                  .map((q) => (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 mb-2"
                    >
                      <p className="text-sm text-gray-500 line-through">{q.text}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Link to analytics */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Session Analytics</h3>
          <p className="text-sm text-gray-400 mt-1">
            View detailed engagement, quiz performance, and question trends from past sessions.
          </p>
        </div>
        <Link
          href="/teacher/analytics"
          className="inline-flex items-center gap-2 rounded-xl border border-lumina-highlight/20 bg-lumina-highlight/5 px-4 py-2.5 text-sm font-semibold text-lumina-highlight hover:bg-lumina-highlight/10 transition-colors shrink-0"
        >
          View Analytics
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
