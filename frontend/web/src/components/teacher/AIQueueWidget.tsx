"use client";

/**
 * AIQueueWidget — TILA (Teacher-Initiated LLM Approval) queue widget.
 *
 * Shows the 3-step flow:
 *   Step 1: Student Question → Step 2: AI Draft Answer → Step 3: Teacher Decision
 *
 * Teachers must APPROVE, REJECT, or MODIFY & APPROVE each AI-generated answer
 * before it is delivered to the student.
 */

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Edit3,
  Clock,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIQueueItem {
  id: string;
  student_id: string;
  student_name?: string;
  course_id: string | null;
  course_name?: string;
  question_text: string;
  ai_generated_answer: string;
  ai_model_used: string;
  ai_confidence: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "MODIFIED_APPROVED";
  created_at: string;
}

interface DecisionPayload {
  status: "APPROVED" | "REJECTED" | "MODIFIED_APPROVED";
  modification?: string;
  feedback?: string;
}

const CONFIDENCE_COLOR = (conf: number | null) => {
  if (conf === null) return "text-muted-foreground";
  if (conf >= 0.8) return "text-emerald-400";
  if (conf >= 0.6) return "text-amber-400";
  return "text-red-400";
};

export default function AIQueueWidget() {
  const [items, setItems] = useState<AIQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<string | null>(null);

  // Modify modal state
  const [modifyModal, setModifyModal] = useState<{ item: AIQueueItem; text: string } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ item: AIQueueItem; feedback: string } | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/ai-queue?status=PENDING&limit=20");
      if (!res.ok) throw new Error("Failed to fetch AI queue");
      const data = await res.json();
      setItems(data.items ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + 30-second polling
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30_000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const submitDecision = async (itemId: string, payload: DecisionPayload) => {
    setDeciding(itemId);
    try {
      const res = await fetch(`/api/teacher/ai-queue/${itemId}/decision`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Decision failed");
      // Optimistically remove from list
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setExpandedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decision failed");
    } finally {
      setDeciding(null);
      setModifyModal(null);
      setRejectModal(null);
    }
  };

  const pendingCount = items.length;

  return (
    <div className="rounded-2xl border border-white/8 bg-surface-900 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Answer Queue</h3>
            <p className="text-[11px] text-muted-foreground">TILA — Teacher approval required</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold">
              {pendingCount} pending
            </span>
          )}
          <button
            onClick={() => { setLoading(true); fetchQueue(); }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* 3-Step Flow Indicator */}
      <div className="px-5 py-3 bg-white/2 border-b border-white/5 flex items-center gap-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold" style={{fontSize:'8px'}}>1</div>
          <span className="text-blue-300/70">Student Question</span>
        </div>
        <div className="flex-1 h-px bg-white/10" />
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold" style={{fontSize:'8px'}}>2</div>
          <span className="text-amber-300/70">AI Draft Answer</span>
        </div>
        <div className="flex-1 h-px bg-white/10" />
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold" style={{fontSize:'8px'}}>3</div>
          <span className="text-emerald-300/70">Teacher Decision</span>
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-white/5 max-h-[480px] overflow-y-auto">
        {loading && items.length === 0 && (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading queue…</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 px-5 py-4 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/40" />
            <p className="text-sm">All caught up — no pending AI answers</p>
          </div>
        )}

        {items.map((item) => {
          const isExpanded = expandedId === item.id;
          const isProcessing = deciding === item.id;

          return (
            <div key={item.id} className="px-5 py-4">
              {/* Item header */}
              <div
                className="flex items-start gap-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div className="w-7 h-7 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-white">
                      {item.student_name ?? `Student ${item.student_id.slice(0, 6)}`}
                    </span>
                    {item.course_name && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">
                        {item.course_name}
                      </span>
                    )}
                    <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.question_text}
                  </p>
                </div>
                <button className="text-muted-foreground ml-1 flex-shrink-0">
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-4 space-y-3">
                  {/* Full question */}
                  <div className="rounded-lg bg-blue-500/5 border border-blue-500/15 p-3">
                    <p className="text-[10px] text-blue-400 font-medium mb-1.5 uppercase tracking-wider">Student Question</p>
                    <p className="text-xs text-white/80 leading-relaxed">{item.question_text}</p>
                  </div>

                  {/* AI Answer */}
                  <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] text-amber-400 font-medium uppercase tracking-wider">AI Draft Answer</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{item.ai_model_used}</span>
                        {item.ai_confidence !== null && (
                          <span className={cn("text-[10px] font-medium", CONFIDENCE_COLOR(item.ai_confidence))}>
                            {Math.round(item.ai_confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed">{item.ai_generated_answer}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1">
                    {/* APPROVE */}
                    <button
                      onClick={() => submitDecision(item.id, { status: "APPROVED" })}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Approve
                    </button>

                    {/* MODIFY & APPROVE */}
                    <button
                      onClick={() => setModifyModal({ item, text: item.ai_generated_answer })}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-medium hover:bg-amber-500/25 transition-colors disabled:opacity-50"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Modify
                    </button>

                    {/* REJECT */}
                    <button
                      onClick={() => setRejectModal({ item, feedback: "" })}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-medium hover:bg-red-500/25 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modify Modal */}
      {modifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-surface-900 border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-semibold text-white">Modify AI Answer</h4>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block mb-2">
                  Edited Answer
                </label>
                <textarea
                  value={modifyModal.text}
                  onChange={(e) => setModifyModal({ ...modifyModal, text: e.target.value })}
                  rows={8}
                  className="w-full rounded-lg bg-white/5 border border-white/10 text-white text-xs p-3 resize-none focus:outline-none focus:border-amber-500/50 leading-relaxed"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setModifyModal(null)}
                  className="flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground text-sm hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => submitDecision(modifyModal.item.id, {
                    status: "MODIFIED_APPROVED",
                    modification: modifyModal.text,
                  })}
                  disabled={!modifyModal.text.trim() || deciding === modifyModal.item.id}
                  className="flex-1 py-2.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deciding === modifyModal.item.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Approve Modified Answer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-surface-900 border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <h4 className="text-sm font-semibold text-white">Reject AI Answer</h4>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground">
                The student will be notified that their question couldn't be answered and will receive your feedback.
              </p>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block mb-2">
                  Feedback for student (optional)
                </label>
                <textarea
                  value={rejectModal.feedback}
                  onChange={(e) => setRejectModal({ ...rejectModal, feedback: e.target.value })}
                  rows={4}
                  placeholder="e.g. This question requires live class discussion…"
                  className="w-full rounded-lg bg-white/5 border border-white/10 text-white text-xs p-3 resize-none focus:outline-none focus:border-red-500/50 placeholder:text-white/20 leading-relaxed"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setRejectModal(null)}
                  className="flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground text-sm hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => submitDecision(rejectModal.item.id, {
                    status: "REJECTED",
                    feedback: rejectModal.feedback,
                  })}
                  disabled={deciding === rejectModal.item.id}
                  className="flex-1 py-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deciding === rejectModal.item.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Reject Answer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
