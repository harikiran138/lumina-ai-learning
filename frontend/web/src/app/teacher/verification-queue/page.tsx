"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { RealAPI } from "@/lib/api";
import type { AIQueueTeacherView } from "@/types/api";
import {
  CheckCircle,
  XCircle,
  Edit2,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  Sparkles,
  ArrowRight,
  RefreshCw,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIAnswer {
  id: string;
  questionText: string;
  aiAnswer: string;
  studentName: string;
  studentAvatar?: string;
  courseTitle: string;
  topicName?: string;
  askedAt: string;
  status: "pending" | "approved" | "edited" | "rejected" | "escalated_to_faculty" | "escalated_to_hod" | "edited_approved";
  confidence: number | null;
  teacherNote?: string;
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "Just now";
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return "Just now";
}

function normalizeStatus(raw: string): AIAnswer["status"] {
  if (raw === "edited_approved") return "edited";
  if (raw === "escalated_to_faculty" || raw === "escalated_to_hod") return raw as AIAnswer["status"];
  return raw as AIAnswer["status"];
}


export default function VerificationQueuePage() {
  const [queue, setQueue] = useState<AIAnswer[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "edited" | "rejected">("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const api = RealAPI.getInstance();
      const data = await api.getTeacherAiQueue();
      const items: AIAnswer[] = (data.items || []).map((row: AIQueueTeacherView) => ({
        id: row.id,
        questionText: row.question_text || "",
        aiAnswer: row.ai_draft || "",
        studentName: (row as AIQueueTeacherView & { student_name?: string }).student_name || "Unknown Student",
        courseTitle: (row as AIQueueTeacherView & { course_name?: string }).course_name || `Course ${row.course_id || ""}`,
        topicName: undefined,
        askedAt: row.created_at || new Date().toISOString(),
        status: normalizeStatus(row.status || "pending"),
        confidence: row.ai_confidence ?? null,
        teacherNote: row.teacher_note || undefined,
      }));
      setQueue(items);
      setTotalPending(data.total_pending ?? items.filter((q) => q.status === "pending").length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const pendingCount = queue.filter((q) => q.status === "pending").length;

  const filtered =
    filter === "all"
      ? queue
      : queue.filter((q) => {
          if (filter === "edited") return q.status === "edited" || q.status === "edited_approved";
          return q.status === filter;
        });

  const handleAction = async (
    id: string,
    action: "approved" | "edited" | "rejected",
    updatedAnswer?: string,
    note?: string,
  ) => {
    setProcessing(id);
    try {
      const api = RealAPI.getInstance();
      if (action === "approved") {
        await api.approveAiQueueItem(id);
      } else if (action === "edited") {
        await api.editApproveAiQueueItem(id, updatedAnswer || "", note);
      } else if (action === "rejected") {
        await api.rejectAiQueueItem(id, note || "Rejected by faculty");
      }
      // Optimistic update
      setQueue((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: action,
                aiAnswer: updatedAnswer ?? item.aiAnswer,
                teacherNote: note ?? item.teacherNote,
              }
            : item,
        ),
      );
      setTotalPending((n) => Math.max(0, n - 1));
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setEditingId(null);
      setEditText("");
      setNoteText("");
      setProcessing(null);
    }
  };

  const startEdit = (item: AIAnswer) => {
    setEditingId(item.id);
    setEditText(item.aiAnswer);
    setNoteText(item.teacherNote ?? "");
    setExpandedId(item.id);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-v2 border-border overflow-hidden"
      >
        <div className="p-8 relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-32 h-32 text-primary" />
          </div>
          
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-primary">
            AI Quality Gate
          </p>
          <h1 className="text-4xl font-display font-bold tracking-tight text-foreground md:text-5xl">
            AI Answer{" "}
            <span className="text-primary border-b-4 border-primary/30">
              Verification Queue
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-text-muted leading-relaxed">
            Every AI-generated answer must be reviewed before students can see
            it. Approve, edit, or reject — you are the final quality gate.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="rounded-2xl border border-warning/20 bg-warning/5 p-5 backdrop-blur-sm"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-text-secondary">Pending Review</p>
              <p className="mt-2 text-4xl font-bold text-warning">{pendingCount}</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="rounded-2xl border border-primary/20 bg-primary/5 p-5 backdrop-blur-sm"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-text-secondary">Approved</p>
              <p className="mt-2 text-4xl font-bold text-primary">
                {queue.filter((q) => q.status === "approved").length}
              </p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="rounded-2xl border border-info/20 bg-info/5 p-5 backdrop-blur-sm"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-text-secondary">Edited</p>
              <p className="mt-2 text-4xl font-bold text-info">
                {queue.filter((q) => q.status === "edited" || q.status === "edited_approved").length}
              </p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="rounded-2xl border border-danger/20 bg-danger/5 p-5 backdrop-blur-sm"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-text-secondary">Rejected</p>
              <p className="mt-2 text-4xl font-bold text-danger">
                {queue.filter((q) => q.status === "rejected").length}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Info banner */}
      <div className="rounded-2xl border border-warning/20 bg-warning/5 px-6 py-4 flex items-start gap-4">
        <Sparkles className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-warning">
            Lumina Core Principle — Faculty is the only AI gatekeeper
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Students never receive unverified AI answers. Every response passes
            through this queue first. Your edits and rejections also train the AI
            to improve future responses.
          </p>
        </div>
      </div>

      {/* Filter tabs + refresh */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "pending", "approved", "edited", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition-all",
              filter === f
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-text-muted hover:border-border/80 hover:text-foreground",
            )}
          >
            {f}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-warning/20 px-1.5 py-0.5 text-warning">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={fetchQueue}
          disabled={loading}
          className="ml-auto rounded-full border border-border px-3 py-1.5 text-xs text-text-muted hover:text-foreground hover:border-border/80 transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Loading / Error states */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading queue...</span>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-danger/20 bg-danger/5 p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-danger" />
          <p className="text-sm text-danger">{error}</p>
          <button
            onClick={fetchQueue}
            className="mt-4 rounded-xl border border-border px-4 py-2 text-xs text-text-muted hover:text-foreground"
          >
            Try again
          </button>
        </div>
      )}

      {/* Queue list */}
      {!loading && !error && (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-3xl border border-dashed border-border bg-background/20 p-12 text-center"
            >
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-primary/50" />
              <h3 className="text-lg font-semibold text-foreground">
                {filter === "pending" ? "All caught up!" : "Nothing here yet"}
              </h3>
              <p className="mt-2 text-sm text-text-muted">
                {filter === "pending"
                  ? "No pending AI answers waiting for your review."
                  : `No ${filter} answers found.`}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((item, idx) => {
                const isExpanded = expandedId === item.id;
                const isEditing = editingId === item.id;
                const isProcessing = processing === item.id;
                const isPending = item.status === "pending";

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "rounded-3xl border bg-surface transition-all overflow-hidden",
                      isPending
                        ? "border-warning/20"
                        : item.status === "approved"
                          ? "border-primary/20"
                          : item.status === "edited" || item.status === "edited_approved"
                            ? "border-info/20"
                            : "border-danger/20",
                      isExpanded && "ring-1 ring-border/10"
                    )}
                  >
                  {/* Card header */}
                  <div
                    className="flex cursor-pointer items-start justify-between gap-4 p-6"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em]",
                            isPending
                              ? "border-warning/30 bg-warning/10 text-warning"
                              : item.status === "approved"
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : item.status === "edited" || item.status === "edited_approved"
                                  ? "border-info/30 bg-info/10 text-info"
                                  : "border-danger/30 bg-danger/10 text-danger",
                          )}
                        >
                          {item.status === "edited_approved" ? "edited" : item.status}
                        </span>
                        <span className="text-xs text-text-secondary">{item.courseTitle}</span>
                        {item.topicName && (
                          <span className="text-xs text-text-muted">• {item.topicName}</span>
                        )}
                      </div>

                      <p className="text-base font-semibold text-foreground">
                        {item.questionText}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {item.studentName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTimeAgo(item.askedAt)}
                        </span>
                        {item.confidence !== null && (
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" />
                            AI confidence: {Math.round(item.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-text-secondary hover:text-foreground transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border"
                      >
                        <div className="p-6 space-y-5">
                          {/* AI Answer */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-bold uppercase tracking-[0.25em] text-text-secondary">
                                AI Generated Answer
                              </p>
                              {item.confidence !== null && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface border border-border">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                  <span className="text-[10px] text-text-muted font-medium">Confidence: {Math.round(item.confidence * 100)}%</span>
                                </div>
                              )}
                            </div>
                            {isEditing ? (
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                rows={6}
                                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-text-muted focus:border-primary/50 focus:outline-none resize-none"
                              />
                            ) : (
                              <div className="rounded-2xl border border-border bg-background/20 px-5 py-4 text-sm leading-relaxed text-foreground">
                                {item.aiAnswer || (
                                  <span className="italic text-text-muted">AI answer not yet generated — still processing.</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Faculty Note */}
                          {isEditing && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-text-secondary">
                                Faculty Note (optional)
                              </p>
                              <input
                                type="text"
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Add a note explaining your edit..."
                                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-text-muted focus:border-primary/50 focus:outline-none"
                              />
                            </motion.div>
                          )}

                          {item.facultyNote && !isEditing && (
                            <div className="rounded-2xl border border-info/20 bg-info/5 px-4 py-3">
                              <p className="text-xs text-text-muted">Faculty note: {item.facultyNote}</p>
                            </div>
                          )}

                          {/* Actions */}
                          {isPending || isEditing ? (
                            <div className="flex flex-wrap gap-3 pt-2">
                              {!isEditing ? (
                                <>
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAction(item.id, "approved")}
                                    disabled={isProcessing || !item.aiAnswer}
                                    className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                    Approve
                                  </motion.button>
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => startEdit(item)}
                                    disabled={isProcessing}
                                    className="inline-flex items-center gap-2 rounded-xl border border-info/30 bg-info/10 px-5 py-2.5 text-sm font-bold text-info hover:bg-info/20 transition-all disabled:opacity-50"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                    Edit &amp; Approve
                                  </motion.button>
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAction(item.id, "rejected", undefined, "Rejected by faculty")}
                                    disabled={isProcessing}
                                    className="inline-flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-5 py-2.5 text-sm font-bold text-danger hover:bg-danger/20 transition-all disabled:opacity-50"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Reject
                                  </motion.button>
                                </>
                              ) : (
                                <>
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() =>
                                      handleAction(item.id, "edited", editText, noteText)
                                    }
                                    disabled={isProcessing || !editText.trim()}
                                    className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
                                  >
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                    Save &amp; Approve Edited Answer
                                  </motion.button>
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditText("");
                                      setNoteText("");
                                    }}
                                    className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-text-muted hover:text-foreground transition-all"
                                  >
                                    Cancel
                                  </motion.button>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-text-secondary pt-2">
                              <RefreshCw className="h-3.5 w-3.5" />
                              This answer has been {item.status === "edited_approved" ? "edited & approved" : item.status} and is{" "}
                              {item.status === "rejected"
                                ? "hidden from students."
                                : "visible to students."}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* AI training feedback note */}
      <div className="rounded-2xl border border-border bg-background/20 p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">AI Training Feedback Loop</h3>
        <p className="text-sm text-text-muted">
          Every edit and rejection you make is logged and used to improve future AI answers.
          The more you interact with this queue, the smarter Lumina becomes for your students.
        </p>
        <Link
          href="/teacher/analytics"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-foreground transition-colors"
        >
          View AI performance analytics
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
