"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Calendar,
  Brain,
  Zap,
  Flame,
} from "lucide-react";
import { getConfiguredApiBase } from "@/lib/api";
import { cn } from "@/lib/utils";

// --- Types ---

type ReviewCard = {
  id: string;
  topic: string;
  question: string;
  answer: string;
  interval: number;
  easeFactor: number;
};

type ReviewRating = "again" | "hard" | "good" | "easy";

type SessionStats = {
  reviewedToday: number;
  dueToday: number;
  streak: number;
  nextReviewIn: string;
};

// SM-2 next-interval computation (client-side preview)
function computeNextInterval(
  interval: number,
  easeFactor: number,
  rating: ReviewRating,
): { interval: number; easeFactor: number } {
  const ratingScore = { again: 0, hard: 3, good: 4, easy: 5 }[rating];
  const newEaseFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - ratingScore) * (0.08 + (5 - ratingScore) * 0.02),
  );
  let newInterval: number;
  if (ratingScore < 3) {
    newInterval = 1;
  } else if (interval === 0) {
    newInterval = 1;
  } else if (interval === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(interval * newEaseFactor);
  }
  return { interval: newInterval, easeFactor: newEaseFactor };
}

const MOCK_CARDS: ReviewCard[] = [
  {
    id: "1",
    topic: "Algebra",
    question: "What is the quadratic formula?",
    answer: "x = (−b ± √(b²−4ac)) / 2a",
    interval: 1,
    easeFactor: 2.5,
  },
  {
    id: "2",
    topic: "Physics",
    question: "State Newton's Second Law of Motion.",
    answer: "Force equals mass times acceleration: F = ma",
    interval: 3,
    easeFactor: 2.5,
  },
  {
    id: "3",
    topic: "Chemistry",
    question: "What is Avogadro's number?",
    answer: "6.022 × 10²³ — the number of particles in one mole of a substance.",
    interval: 7,
    easeFactor: 2.5,
  },
  {
    id: "4",
    topic: "Biology",
    question: "What organelle is known as the powerhouse of the cell?",
    answer:
      "The mitochondria — it generates most of the cell's ATP through cellular respiration.",
    interval: 14,
    easeFactor: 2.8,
  },
  {
    id: "5",
    topic: "Mathematics",
    question: "Define a derivative in calculus.",
    answer:
      "The derivative measures the instantaneous rate of change of a function: f′(x) = lim(h→0) [(f(x+h) − f(x)) / h]",
    interval: 2,
    easeFactor: 2.2,
  },
];

export default function SpacedRepetitionPage() {
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    reviewedToday: 0,
    dueToday: 0,
    streak: 0,
    nextReviewIn: "—",
  });
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    const fetchCards = async () => {
      setIsLoading(true);
      try {
        const apiBase = getConfiguredApiBase();
        if (apiBase) {
          const res = await fetch(`${apiBase}/api/student/spaced-repetition`, {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            setCards(data.cards ?? []);
            setSessionStats({
              reviewedToday: data.reviewedToday ?? 0,
              dueToday: data.dueToday ?? data.cards?.length ?? 0,
              streak: data.streak ?? 0,
              nextReviewIn: data.nextReviewIn ?? "Tomorrow",
            });
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // fall through to mock
      }
      setCards(MOCK_CARDS);
      setSessionStats({ reviewedToday: 3, dueToday: MOCK_CARDS.length, streak: 7, nextReviewIn: "Tomorrow" });
      setIsLoading(false);
    };
    fetchCards();
  }, []);

  const currentCard = cards[currentIndex];

  const handleRate = useCallback(
    async (rating: ReviewRating) => {
      if (!currentCard) return;
      const { interval, easeFactor } = computeNextInterval(
        currentCard.interval,
        currentCard.easeFactor,
        rating,
      );
      try {
        const apiBase = getConfiguredApiBase();
        if (apiBase) {
          await fetch(`${apiBase}/api/student/spaced-repetition/review`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cardId: currentCard.id, rating, newInterval: interval, newEaseFactor: easeFactor }),
          });
        }
      } catch {
        // ignore — session continues offline
      }
      setReviewedCount((prev) => prev + 1);
      setIsFlipped(false);
      if (currentIndex + 1 >= cards.length) {
        setSessionComplete(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentCard, currentIndex, cards.length],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lumina-highlight" />
      </div>
    );
  }

  if (sessionComplete || cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-8">
        <div className="text-center glass-v2-gold border-white/5 rounded-[2.5rem] p-12">
          <div className="w-20 h-20 rounded-full bg-lumina-highlight/20 border border-lumina-highlight/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-lumina-highlight" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-3">
            {cards.length === 0 ? "All Caught Up!" : "Session Complete!"}
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            {cards.length === 0
              ? "No cards due for review today. Great work staying on top of your revisions!"
              : `You reviewed ${reviewedCount} card${reviewedCount !== 1 ? "s" : ""} this session. Your memory is strengthening!`}
          </p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Reviewed", value: String(reviewedCount + sessionStats.reviewedToday) },
              { label: "Streak", value: `${sessionStats.streak}d 🔥` },
              { label: "Next Review", value: sessionStats.nextReviewIn },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">{m.label}</p>
                <p className="text-2xl font-bold text-white">{m.value}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/student/progress"
              className="h-12 px-8 rounded-2xl bg-lumina-highlight text-black font-black inline-flex items-center justify-center gap-2 hover:scale-105 transition-all"
            >
              View Progress <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/student/ai_tutor"
              className="h-12 px-8 rounded-2xl border border-white/10 text-white font-bold inline-flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
            >
              Ask AI Tutor
            </Link>
          </div>
        </div>

        <section className="glass-v2-gold border-white/5 rounded-[2rem] overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-lumina-highlight" />
              Upcoming Review Schedule
            </h3>
          </div>
          <div className="p-6 grid grid-cols-7 gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
              <div key={day} className="text-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">{day}</p>
                <div
                  className={cn(
                    "h-10 rounded-xl flex items-center justify-center text-xs font-bold",
                    i === 0
                      ? "bg-lumina-highlight/20 text-lumina-highlight border border-lumina-highlight/30"
                      : i < 3
                        ? "bg-white/5 text-gray-300 border border-white/5"
                        : "bg-white/[0.02] text-gray-600 border border-white/[0.03]",
                  )}
                >
                  {i === 0 ? reviewedCount : i < 3 ? 5 + i : 3}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  const progress = (currentIndex / cards.length) * 100;
  const nextGoodInterval = computeNextInterval(currentCard.interval, currentCard.easeFactor, "good").interval;
  const nextEasyInterval = computeNextInterval(currentCard.interval, currentCard.easeFactor, "easy").interval;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <RefreshCw className="w-7 h-7 text-lumina-highlight" />
            Daily Revision
          </h1>
          <p className="text-gray-400 mt-1">Spaced repetition — study smarter, retain longer.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <StatPill icon={<Flame className="w-4 h-4 text-amber-500" />} label="Streak" value={`${sessionStats.streak}d`} />
          <StatPill icon={<CheckCircle className="w-4 h-4 text-lumina-highlight" />} label="Today" value={`${reviewedCount + sessionStats.reviewedToday} done`} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{currentIndex} of {cards.length} cards</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-lumina-highlight to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        className={cn(
          "glass-v2-gold border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-300 cursor-pointer select-none",
          !isFlipped && "hover:border-white/10",
        )}
        onClick={() => !isFlipped && setIsFlipped(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && !isFlipped && setIsFlipped(true)}
        aria-label={isFlipped ? "Card answer revealed" : "Click to reveal answer"}
      >
        <div className="flex items-center justify-between px-8 pt-8 pb-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lumina-highlight/10 border border-lumina-highlight/20 text-lumina-highlight text-[10px] font-black uppercase tracking-widest">
            <Brain className="w-3 h-3" />
            {currentCard.topic}
          </span>
          <span className="text-xs text-gray-500">Card {currentIndex + 1}/{cards.length}</span>
        </div>
        <div className="p-8 min-h-[260px] flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4">
            {isFlipped ? "Answer" : "Question"}
          </p>
          <p className="text-2xl font-display font-bold text-white leading-relaxed">
            {isFlipped ? currentCard.answer : currentCard.question}
          </p>
        </div>
        {!isFlipped && (
          <div className="px-8 pb-8 text-center">
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-lumina-highlight" />
              Click card or press Enter to reveal answer
            </p>
          </div>
        )}
      </div>

      {/* Rating buttons */}
      {isFlipped && (
        <div className="space-y-4">
          <p className="text-center text-xs uppercase tracking-widest text-gray-500 font-bold">
            How well did you know this?
          </p>
          <div className="grid grid-cols-4 gap-3">
            <RatingButton label="Again" hint="< 1 min" icon={<XCircle className="w-5 h-5" />} tone="danger" onClick={() => handleRate("again")} />
            <RatingButton label="Hard" hint="< 10 min" icon={<RotateCcw className="w-5 h-5" />} tone="warning" onClick={() => handleRate("hard")} />
            <RatingButton label="Good" hint={`${nextGoodInterval}d`} icon={<CheckCircle className="w-5 h-5" />} tone="neutral" onClick={() => handleRate("good")} />
            <RatingButton label="Easy" hint={`${nextEasyInterval}d`} icon={<Zap className="w-5 h-5" />} tone="accent" onClick={() => handleRate("easy")} />
          </div>
        </div>
      )}

      {/* Algorithm explainer */}
      <section className="glass-v2-gold border-white/5 rounded-[2rem] p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-lumina-highlight" />
          How Spaced Repetition Works
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed mb-4">
          Lumina uses an SM-2 / FSRS algorithm to schedule each concept just before you're
          likely to forget it. Rate honestly — the system adapts intervals to your personal
          memory curve for maximum long-term retention.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { label: "Again", color: "text-red-400", desc: "Forgotten — review soon" },
            { label: "Hard", color: "text-amber-400", desc: "Struggled — short interval" },
            { label: "Good", color: "text-gray-300", desc: "Recalled — standard interval" },
            { label: "Easy", color: "text-lumina-highlight", desc: "Trivial — extend interval" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <p className={`font-bold mb-1 ${item.color}`}>{item.label}</p>
              <p className="text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5 text-sm">
      {icon}
      <span className="text-gray-500 text-xs">{label}:</span>
      <span className="text-white font-bold">{value}</span>
    </div>
  );
}

function RatingButton({
  label,
  hint,
  icon,
  tone,
  onClick,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  tone: "danger" | "warning" | "neutral" | "accent";
  onClick: () => void;
}) {
  const tones: Record<string, string> = {
    danger: "border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40",
    warning: "border-amber-500/20 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/40",
    neutral: "border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/20",
    accent: "border-lumina-highlight/20 text-lumina-highlight hover:bg-lumina-highlight/10 hover:border-lumina-highlight/40",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all active:scale-95",
        tones[tone],
      )}
    >
      {icon}
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      <span className="text-[10px] text-gray-500">{hint}</span>
    </button>
  );
}
