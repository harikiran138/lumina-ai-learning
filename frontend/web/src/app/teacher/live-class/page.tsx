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
      <section className="glass-v2 border-border overflow-hidden">
        <div className="p-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-primary">
            Real-Time Teaching
          </p>
          <h1 className="text-4xl font-display font-bold tracking-tight text-foreground md:text-5xl">
            Live Class{" "}
            <span className="text-primary border-b-4 border-primary/30">
              Control Center
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-text-muted leading-relaxed">
            Launch live sessions, run instant quizzes, collect anonymous student
            questions, and monitor real-time engagement — all from one view.
          </p>

          {/* Session controls */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {sessionStatus === "idle" && (
              <button
                onClick={startSession}
                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-6 py-3 text-sm font-bold text-primary hover:bg-primary/20 transition-colors"
              >
                <Radio className="h-4 w-4" />
                Start Live Session
              </button>
            )}
            {sessionStatus === "live" && (
              <>
                <div className="inline-flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
                  <span className="h-2 w-2 rounded-full bg-danger animate-pulse" />
                  LIVE
                </div>
                <button
                  onClick={endSession}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-muted hover:text-foreground transition-colors"
                >
                  <Square className="h-4 w-4" />
                  End Session
                </button>
              </>
            )}
            {sessionStatus === "ended" && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-muted">
                <CheckCircle className="h-4 w-4 text-primary" />
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
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-text-secondary">{m.label}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{m.value}</p>
            {m.trend === "up" && (
              <p className="mt-1 text-xs text-primary">Trending up</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        {/* Live Quizzes */}
        <section className="glass-v2 border-border overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-6">
            <div>
              <h2 className="text-lg font-display font-bold text-foreground">Live Quizzes</h2>
              <p className="mt-1 text-sm text-text-muted">
                Launch instant polls and check comprehension in real time.
              </p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-elevated transition-colors">
              <Plus className="h-3.5 w-3.5" />
              New Quiz
            </button>
          </div>
          <div className="space-y-4 p-6">
            {activeQuiz && (
              <div className="rounded-2xl border border-danger/20 bg-danger/5 px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-2 w-2 rounded-full bg-danger animate-pulse" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-danger">
                    Quiz Active
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground mb-3">
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
                        <div className="flex-1 h-6 rounded-full bg-surface overflow-hidden relative">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              opt.isCorrect
                                ? "bg-primary/40"
                                : "bg-border",
                            )}
                            style={{ width: `${pct}%` }}
                          />
                          <span className="absolute inset-0 flex items-center px-3 text-xs text-foreground">
                            {opt.text}
                          </span>
                        </div>
                        <span className="text-xs text-text-muted w-8 text-right">
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => closeQuiz(activeQuiz.id)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text-muted hover:text-foreground transition-colors"
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
                  className="rounded-2xl border border-border bg-surface p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <p className="text-sm font-semibold text-foreground flex-1">
                      {quiz.question}
                    </p>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] shrink-0",
                        quiz.status === "closed"
                          ? "border-border text-text-secondary"
                          : "border-warning/20 text-warning",
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
                            <div className="flex-1 h-5 rounded-full bg-surface overflow-hidden relative">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  opt.isCorrect
                                    ? "bg-primary/30"
                                    : "bg-border",
                                )}
                                style={{ width: `${pct}%` }}
                              />
                              <span className="absolute inset-0 flex items-center px-3 text-[11px] text-text-secondary">
                                {opt.text}
                                {opt.isCorrect && (
                                  <CheckCircle className="ml-1 h-3 w-3 text-primary" />
                                )}
                              </span>
                            </div>
                            <span className="text-xs text-text-secondary w-8 text-right">
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                      <p className="text-xs text-text-secondary pt-1">
                        {quiz.totalResponses} responses
                      </p>
                    </div>
                  )}
                  {quiz.status === "draft" && (
                    <button
                      onClick={() => launchQuiz(quiz.id)}
                      disabled={sessionStatus !== "live"}
                      className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
        <section className="glass-v2 border-border overflow-hidden">
          <div className="border-b border-border p-6">
            <h2 className="text-lg font-display font-bold text-foreground">
              Anonymous Questions
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Students can ask questions anonymously. Upvoted questions surface
              to the top.
            </p>
          </div>
          <div className="space-y-3 p-6">
            {unanswered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                <HelpCircle className="mx-auto mb-3 h-8 w-8 text-text-secondary" />
                <p className="text-sm text-text-muted">No unanswered questions</p>
              </div>
            ) : (
              unanswered
                .sort((a, b) => b.votes - a.votes)
                .map((q) => (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-border bg-surface p-4"
                  >
                    <p className="text-sm text-foreground mb-2">{q.text}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {q.votes} votes
                        </span>
                        <span>{q.askedAt}</span>
                      </div>
                      <button
                        onClick={() => markAnswered(q.id)}
                        className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-semibold text-primary hover:bg-primary/10 transition-colors"
                      >
                        Mark Answered
                      </button>
                    </div>
                  </div>
                ))
            )}

            {anonQuestions.filter((q) => q.answered).length > 0 && (
              <div className="pt-2">
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-text-secondary">
                  Answered
                </p>
                {anonQuestions
                  .filter((q) => q.answered)
                  .map((q) => (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-border bg-surface/50 p-4 mb-2"
                    >
                      <p className="text-sm text-text-secondary line-through">{q.text}</p>
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
