/**
 * useAdaptiveAssessment — Full adaptive assessment session hook.
 *
 * Combines:
 *   1. useBehaviorTracker — real-time signal capture
 *   2. POST /student/adaptive-question — BKT-based question selection
 *   3. POST /student/quiz-result — result recording + KPI update
 *   4. GET /student/review-schedule — spaced repetition schedule
 *
 * Usage:
 *   const { question, submitAnswer, isLoading, sessionStats, reviewSchedule } =
 *     useAdaptiveAssessment({ course_id: "...", topic_id: "..." });
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { requireApiBase } from "@/lib/api";
import { useBehaviorTracker } from "./useBehaviorTracker";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdaptiveQuestion {
  question_id: string;
  quiz_id: string;
  quiz_title: string;
  question: string;
  options: string[];
  explanation?: string;
  difficulty: string;
  topic?: string;
  tags: string[];
  adaptive: {
    mastery_before: number;
    target_difficulty: number;
    zpd_score: number;
    is_weak_topic: boolean;
  };
}

export interface AnswerResult {
  is_correct: boolean;
  explanation?: string;
  mastery_after?: number;
  next_review_at?: string;
}

export interface SessionStats {
  total_answered: number;
  correct: number;
  accuracy: number;
  mastery_start: number;
  mastery_current: number;
  weak_topics_hit: number;
  paste_count: number;
}

export interface ReviewItem {
  skill_name: string;
  course_id: string;
  mastery_score: number;
  urgency: number;
  next_review_at?: string;
  interval_days: number;
}

export interface UseAdaptiveAssessmentOptions {
  course_id: string;
  topic_id?: string;
  /** Auto-load first question on mount (default: true) */
  auto_start?: boolean;
  /** Called after each answer is recorded */
  onAnswer?: (result: AnswerResult) => void;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token")
      : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchAdaptiveQuestion(
  course_id: string,
  topic_id?: string,
  exclude_ids: string[] = []
): Promise<AdaptiveQuestion | null> {
  const res = await fetch(`${requireApiBase()}/student/adaptive-question`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ course_id, topic_id, exclude_ids }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function postQuizResult(payload: {
  topic?: string;
  difficulty: string;
  score: number;
  total_questions: number;
  correct_count: number;
  course_id?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  await fetch(`${requireApiBase()}/student/quiz-result`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  }).catch(() => {});
}

async function fetchReviewSchedule(
  course_id?: string,
  limit = 8
): Promise<ReviewItem[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (course_id) params.set("course_id", course_id);
  const res = await fetch(
    `${requireApiBase()}/student/review-schedule?${params}`,
    { headers: authHeaders() }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.schedule || [];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdaptiveAssessment({
  course_id,
  topic_id,
  auto_start = true,
  onAnswer,
}: UseAdaptiveAssessmentOptions) {
  const [question, setQuestion] = useState<AdaptiveQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewSchedule, setReviewSchedule] = useState<ReviewItem[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    total_answered: 0,
    correct: 0,
    accuracy: 0,
    mastery_start: 0,
    mastery_current: 0,
    weak_topics_hit: 0,
    paste_count: 0,
  });

  // Track which question IDs have been shown this session to avoid repeats
  const shownIds = useRef<string[]>([]);
  // Track mastery at session start (set on first question load)
  const masteryStartRef = useRef<number | null>(null);

  // Attach behavior tracker scoped to the current question
  const { flush: flushBehavior, sessionId } = useBehaviorTracker({
    course_id,
    question_id: question?.question_id,
    enabled: true,
  });

  // ── Load next question ─────────────────────────────────────────────────

  const loadNextQuestion = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = await fetchAdaptiveQuestion(course_id, topic_id, shownIds.current);
      if (q) {
        shownIds.current.push(q.question_id);
        // Record mastery at start of session
        if (masteryStartRef.current === null) {
          masteryStartRef.current = q.adaptive.mastery_before;
          setSessionStats((prev) => ({
            ...prev,
            mastery_start: q.adaptive.mastery_before,
            mastery_current: q.adaptive.mastery_before,
          }));
        }
        setQuestion(q);
      }
    } finally {
      setIsLoading(false);
    }
  }, [course_id, topic_id]);

  // ── Submit answer ──────────────────────────────────────────────────────

  const submitAnswer = useCallback(
    async (
      selectedOption: string,
      correctAnswer: string,
      timeTakenSeconds: number
    ): Promise<AnswerResult> => {
      if (!question) {
        return { is_correct: false };
      }

      // Flush behavior signals immediately on answer
      await flushBehavior();

      const is_correct =
        selectedOption.trim().toLowerCase() ===
        correctAnswer.trim().toLowerCase();

      // Record quiz result to backend (triggers KPI recomputation)
      const score = is_correct ? 100 : 0;
      await postQuizResult({
        topic: question.topic,
        difficulty: question.difficulty,
        score,
        total_questions: 1,
        correct_count: is_correct ? 1 : 0,
        course_id,
        details: {
          question_id: question.question_id,
          quiz_id: question.quiz_id,
          time_taken_seconds: timeTakenSeconds,
          session_id: sessionId,
          mastery_before: question.adaptive.mastery_before,
          was_weak_topic: question.adaptive.is_weak_topic,
        },
      });

      // Update session stats
      setSessionStats((prev) => {
        const newCorrect = prev.correct + (is_correct ? 1 : 0);
        const newTotal = prev.total_answered + 1;
        return {
          ...prev,
          total_answered: newTotal,
          correct: newCorrect,
          accuracy: Math.round((newCorrect / newTotal) * 100),
          weak_topics_hit:
            prev.weak_topics_hit + (question.adaptive.is_weak_topic ? 1 : 0),
        };
      });

      const result: AnswerResult = {
        is_correct,
        explanation: question.explanation,
        mastery_after: question.adaptive.mastery_before + (is_correct ? 0.05 : -0.02),
      };

      onAnswer?.(result);
      return result;
    },
    [question, course_id, flushBehavior, sessionId, onAnswer]
  );

  // ── Load review schedule ───────────────────────────────────────────────

  const refreshReviewSchedule = useCallback(async () => {
    const schedule = await fetchReviewSchedule(course_id);
    setReviewSchedule(schedule);
  }, [course_id]);

  // ── Auto-start ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (auto_start) {
      loadNextQuestion();
      refreshReviewSchedule();
    }
  }, [auto_start, loadNextQuestion, refreshReviewSchedule]);

  // ─────────────────────────────────────────────────────────────────────────

  return {
    /** Current adaptive question (null while loading) */
    question,
    /** Load the next question (call after submitAnswer to advance) */
    loadNextQuestion,
    /** Submit the student's answer; returns correctness + explanation */
    submitAnswer,
    /** True while fetching a question */
    isLoading,
    /** Aggregated stats for the current session */
    sessionStats,
    /** Spaced-repetition topics due for review */
    reviewSchedule,
    /** Refresh the review schedule manually */
    refreshReviewSchedule,
    /** Stable session ID (correlates with behavior logs) */
    sessionId,
  };
}
