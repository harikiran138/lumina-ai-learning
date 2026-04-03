"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BrainCircuit, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";

type QuestionOption = {
  value: string;
  label: string;
  helper?: string;
};

type AdaptiveQuestion = {
  id: string;
  dimension: string;
  responseType: "text" | "single_select" | "multi_select";
  prompt: string;
  helper?: string;
  options?: QuestionOption[];
  sequence?: number;
};

type AdaptiveSession = {
  sessionId: string;
  status: string;
  role: string;
  estimatedTotalQuestions: number;
  questionsAnswered: number;
  question?: AdaptiveQuestion | null;
  result?: AdaptiveResult;
};

type AdaptiveResult = {
  level?: string;
  scores?: Record<string, number>;
  learningStyle?: { primary?: string; top_modes?: string[] };
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
};

const shellClass =
  "rounded-[28px] border border-amber-200/10 bg-[linear-gradient(180deg,rgba(250,204,21,0.10),rgba(10,10,10,0.96)_20%,rgba(10,10,10,0.99))] p-6 shadow-[0_25px_100px_rgba(0,0,0,0.45)]";

const optionClass =
  "rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-left transition hover:border-white/15 hover:bg-white/[0.06]";

export default function AdaptiveOnboardingPanel({ onComplete }: { onComplete: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<AdaptiveSession | null>(null);
  const [result, setResult] = useState<AdaptiveResult | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [singleAnswer, setSingleAnswer] = useState("");
  const [multiAnswer, setMultiAnswer] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.startAdaptiveOnboarding({ role: "student" });
        if (response?.complete || response?.status === "completed") {
          setResult(response.result || null);
          setSession(response);
          return;
        }
        setSession(response);
      } catch (loadError: any) {
        const message = loadError?.message || "Failed to start adaptive calibration";
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const question = session?.question || null;

  useEffect(() => {
    setTextAnswer("");
    setSingleAnswer("");
    setMultiAnswer([]);
  }, [question?.id]);

  const canSubmit = useMemo(() => {
    if (!question) return false;
    if (question.responseType === "text") {
      return textAnswer.trim().length >= 8;
    }
    if (question.responseType === "single_select") {
      return !!singleAnswer;
    }
    return multiAnswer.length > 0;
  }, [multiAnswer.length, question, singleAnswer, textAnswer]);

  const toggleMulti = (value: string) => {
    setMultiAnswer((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const submitAnswer = async () => {
    if (!session?.sessionId || !question || !canSubmit || isSubmitting) {
      return;
    }

    const answer =
      question.responseType === "text"
        ? textAnswer.trim()
        : question.responseType === "single_select"
          ? singleAnswer
          : multiAnswer;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await api.answerAdaptiveOnboarding({
        sessionId: session.sessionId,
        questionId: question.id,
        answer,
      });
      if (response?.complete || response?.status === "completed") {
        setResult(response.result || null);
        setSession((current) => ({
          ...(current || {}),
          ...response,
        }));
        toast.success("Adaptive calibration completed");
        return;
      }
      setSession(response);
    } catch (submitError: any) {
      const message = submitError?.message || "Failed to submit adaptive answer";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={shellClass}>
        <div className="flex items-center gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing adaptive calibration
        </div>
      </div>
    );
  }

  if (result) {
    const scores = result.scores || {};
    return (
      <div className="space-y-6">
        <div className={shellClass}>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-black">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">Adaptive Calibration</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Your starting profile is ready.</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                Lumina now has a first-pass difficulty level, learning-style profile, and knowledge graph seed for your tutor experience.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <MetricCard label="Assigned Level" value={result.level || "Basic"} />
            <MetricCard label="Knowledge" value={formatScore(scores.knowledge_score)} />
            <MetricCard label="Confidence" value={formatScore(scores.confidence_score)} />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <ListCard
              title="Strengths"
              items={result.strengths || ["Adaptive personalization is ready to start."]}
            />
            <ListCard
              title="Focus Areas"
              items={result.weaknesses || ["Continue building baseline data through lessons and assessments."]}
            />
          </div>

          <div className="mt-6 rounded-[24px] border border-white/8 bg-black/30 p-5">
            <p className="text-sm font-semibold text-white">Recommended tutor behavior</p>
            <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
              {(result.recommendations || []).map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
              Primary learning mode: {(result.learningStyle?.primary || "examples").replace(/_/g, " ")}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#facc15,#fde68a)] px-6 py-3 text-sm font-semibold text-black transition hover:brightness-105"
          >
            Continue to dashboard
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={shellClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">Adaptive Calibration</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">One short diagnostic before we launch your dashboard.</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
              This is the role-aware intelligence layer from your onboarding spec: dynamic follow-ups, learning-style detection, and baseline knowledge mapping.
            </p>
          </div>
          <div className="rounded-3xl border border-white/8 bg-black/35 px-5 py-4 text-sm text-zinc-300">
            <p className="font-medium text-white">
              {session?.questionsAnswered || 0}/{session?.estimatedTotalQuestions || 0} answered
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">Adaptive sequence</p>
          </div>
        </div>

        {error ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {question ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-[24px] border border-amber-300/15 bg-black/30 p-5">
              <div className="flex items-center gap-3 text-amber-100">
                <BrainCircuit className="h-5 w-5" />
                <p className="text-xs font-semibold uppercase tracking-[0.25em]">
                  Question {question.sequence || (session?.questionsAnswered || 0) + 1}
                </p>
              </div>
              <h4 className="mt-3 text-xl font-semibold text-white">{question.prompt}</h4>
              {question.helper ? <p className="mt-3 text-sm leading-6 text-zinc-400">{question.helper}</p> : null}
            </div>

            {question.responseType === "text" ? (
              <textarea
                className="min-h-[180px] w-full rounded-[24px] border border-amber-200/10 bg-zinc-950/90 px-4 py-4 text-sm text-white outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 placeholder:text-zinc-500"
                placeholder="Write your answer here"
                value={textAnswer}
                onChange={(event) => setTextAnswer(event.target.value)}
              />
            ) : null}

            {question.responseType === "single_select" ? (
              <div className="grid gap-4 md:grid-cols-2">
                {(question.options || []).map((option) => {
                  const selected = singleAnswer === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSingleAnswer(option.value)}
                      className={`${optionClass} ${selected ? "border-amber-300/50 bg-amber-300/10" : ""}`}
                    >
                      <p className="text-base font-semibold text-white">{option.label}</p>
                      {option.helper ? <p className="mt-2 text-sm leading-6 text-zinc-400">{option.helper}</p> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {question.responseType === "multi_select" ? (
              <div className="grid gap-4 md:grid-cols-2">
                {(question.options || []).map((option) => {
                  const selected = multiAnswer.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleMulti(option.value)}
                      className={`${optionClass} ${selected ? "border-amber-300/50 bg-amber-300/10" : ""}`}
                    >
                      <p className="text-base font-semibold text-white">{option.label}</p>
                      {option.helper ? <p className="mt-2 text-sm leading-6 text-zinc-400">{option.helper}</p> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={submitAnswer}
                disabled={!canSubmit || isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#facc15,#fde68a)] px-6 py-3 text-sm font-semibold text-black transition hover:brightness-105 disabled:opacity-45"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Submit answer
                {!isSubmitting ? <ChevronRight className="h-4 w-4" /> : null}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/30 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/30 p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
        {items.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </div>
  );
}

function formatScore(value?: number) {
  if (typeof value !== "number") {
    return "0.00";
  }
  return value.toFixed(2);
}
