/**
 * useBehaviorTracker — Real-time student behavior signal capture.
 *
 * Captures: typing speed, scroll depth, time-on-question, paste detection,
 * idle detection, focus/blur events, and mouse inactivity.
 *
 * Batches signals and flushes to POST /student/behavior every 10 seconds
 * (or immediately on unmount / question change).
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { requireApiBase } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BehaviorEventType =
  | "typing_burst"
  | "paste_detected"
  | "scroll"
  | "idle"
  | "focus_lost"
  | "focus_regained"
  | "mouse_idle"
  | "time_on_question"
  | "session_heartbeat";

export interface BehaviorSignal {
  event_type: BehaviorEventType;
  /** ISO timestamp */
  ts: string;
  payload: Record<string, unknown>;
}

export interface BehaviorBatch {
  course_id?: string;
  question_id?: string;
  session_id: string;
  signals: BehaviorSignal[];
}

export interface BehaviorTrackerOptions {
  /** Course context (optional) */
  course_id?: string;
  /** Current question being tracked (changes trigger a flush) */
  question_id?: string;
  /** Milliseconds between automatic flushes (default: 10 000) */
  flush_interval_ms?: number;
  /** Seconds of no input before "idle" signal fires (default: 30) */
  idle_threshold_s?: number;
  /** Whether tracking is enabled (default: true) */
  enabled?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FLUSH_INTERVAL_MS = 10_000;
const IDLE_THRESHOLD_S = 30;
const MOUSE_IDLE_THRESHOLD_MS = 15_000;
const MIN_CHARS_FOR_TYPING_BURST = 3;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBehaviorTracker(options: BehaviorTrackerOptions = {}) {
  const {
    course_id,
    question_id,
    flush_interval_ms = FLUSH_INTERVAL_MS,
    idle_threshold_s = IDLE_THRESHOLD_S,
    enabled = true,
  } = options;

  // Stable session id for this mount lifecycle
  const sessionIdRef = useRef<string>(
    typeof crypto !== "undefined"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  );

  const signalBatch = useRef<BehaviorSignal[]>([]);
  const questionStartRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());
  const lastMouseMoveRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const keystrokeTimesRef = useRef<number[]>([]);
  const questionIdRef = useRef<string | undefined>(question_id);

  // ── helpers ──────────────────────────────────────────────────────────────

  const now = () => new Date().toISOString();

  const push = useCallback((signal: BehaviorSignal) => {
    signalBatch.current.push(signal);
  }, []);

  const flush = useCallback(
    async (extra?: Partial<BehaviorBatch>) => {
      if (!enabled) return;
      const batch = signalBatch.current.splice(0);
      if (batch.length === 0) return;

      const body: BehaviorBatch = {
        course_id,
        question_id: questionIdRef.current,
        session_id: sessionIdRef.current,
        signals: batch,
        ...extra,
      };

      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token") ||
              localStorage.getItem("access_token") ||
              sessionStorage.getItem("access_token")
            : null;

        await fetch(`${requireApiBase()}/student/behavior`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
          keepalive: true, // allow flush on page unload
        });
      } catch {
        // Non-critical — silently discard on network error
      }
    },
    [course_id, enabled]
  );

  // ── typing speed tracker ─────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      lastActivityRef.current = Date.now();

      const printable = e.key.length === 1;
      if (!printable) return;

      const t = Date.now();
      keystrokeTimesRef.current.push(t);

      // Keep only last 30 keystrokes
      if (keystrokeTimesRef.current.length > 30) {
        keystrokeTimesRef.current.shift();
      }

      const times = keystrokeTimesRef.current;
      if (times.length >= MIN_CHARS_FOR_TYPING_BURST) {
        const windowMs = t - times[0];
        const chars_per_second =
          windowMs > 0 ? (times.length / windowMs) * 1000 : 0;

        // Emit a burst summary every 10 chars
        if (times.length % 10 === 0) {
          push({
            event_type: "typing_burst",
            ts: now(),
            payload: {
              chars_per_second: Math.round(chars_per_second * 10) / 10,
              sample_size: times.length,
            },
          });
        }
      }

      // Reset idle timer
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        push({
          event_type: "idle",
          ts: now(),
          payload: { idle_seconds: idle_threshold_s },
        });
      }, idle_threshold_s * 1000);
    },
    [enabled, idle_threshold_s, push]
  );

  // ── paste detector ───────────────────────────────────────────────────────

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (!enabled) return;
      const pasted = e.clipboardData?.getData("text") ?? "";
      push({
        event_type: "paste_detected",
        ts: now(),
        payload: {
          char_count: pasted.length,
          word_count: pasted.trim().split(/\s+/).length,
        },
      });
    },
    [enabled, push]
  );

  // ── scroll tracker ───────────────────────────────────────────────────────

  const lastScrollDepthRef = useRef<number>(0);
  const handleScroll = useCallback(() => {
    if (!enabled) return;
    lastActivityRef.current = Date.now();

    const el = document.documentElement;
    const scrolled = el.scrollTop + el.clientHeight;
    const total = el.scrollHeight;
    const depth = total > 0 ? Math.round((scrolled / total) * 100) : 0;

    // Only emit if depth changed meaningfully (>5%)
    if (Math.abs(depth - lastScrollDepthRef.current) >= 5) {
      lastScrollDepthRef.current = depth;
      push({
        event_type: "scroll",
        ts: now(),
        payload: { depth_percent: depth },
      });
    }
  }, [enabled, push]);

  // ── mouse idle tracker ───────────────────────────────────────────────────

  const handleMouseMove = useCallback(() => {
    if (!enabled) return;
    const t = Date.now();
    lastMouseMoveRef.current = t;
    lastActivityRef.current = t;

    if (mouseIdleTimerRef.current) clearTimeout(mouseIdleTimerRef.current);
    mouseIdleTimerRef.current = setTimeout(() => {
      push({
        event_type: "mouse_idle",
        ts: now(),
        payload: { idle_ms: MOUSE_IDLE_THRESHOLD_MS },
      });
    }, MOUSE_IDLE_THRESHOLD_MS);
  }, [enabled, push]);

  // ── focus / blur tracker ─────────────────────────────────────────────────

  const handleVisibilityChange = useCallback(() => {
    if (!enabled) return;
    if (document.hidden) {
      push({ event_type: "focus_lost", ts: now(), payload: {} });
    } else {
      push({ event_type: "focus_regained", ts: now(), payload: {} });
    }
  }, [enabled, push]);

  // ── question change → flush + record time-on-question ────────────────────

  useEffect(() => {
    if (!enabled) return;

    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000);

    if (questionIdRef.current && elapsed > 1) {
      push({
        event_type: "time_on_question",
        ts: now(),
        payload: {
          question_id: questionIdRef.current,
          seconds: elapsed,
        },
      });
      flush();
    }

    questionIdRef.current = question_id;
    questionStartRef.current = Date.now();
    keystrokeTimesRef.current = [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question_id]);

  // ── mount / unmount lifecycle ────────────────────────────────────────────

  useEffect(() => {
    if (!enabled) return;

    // Heartbeat signal on first mount
    push({
      event_type: "session_heartbeat",
      ts: now(),
      payload: { session_id: sessionIdRef.current },
    });

    // Attach listeners
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Periodic auto-flush
    flushTimerRef.current = setInterval(() => flush(), flush_interval_ms);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (mouseIdleTimerRef.current) clearTimeout(mouseIdleTimerRef.current);
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);

      // Final flush on unmount
      const elapsed = Math.round(
        (Date.now() - questionStartRef.current) / 1000
      );
      if (questionIdRef.current && elapsed > 1) {
        push({
          event_type: "time_on_question",
          ts: now(),
          payload: { question_id: questionIdRef.current, seconds: elapsed },
        });
      }
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // ── public API ───────────────────────────────────────────────────────────

  return {
    /** Manually flush the current batch (e.g. on form submit) */
    flush,
    /** Session ID for correlation with backend events */
    sessionId: sessionIdRef.current,
  };
}
