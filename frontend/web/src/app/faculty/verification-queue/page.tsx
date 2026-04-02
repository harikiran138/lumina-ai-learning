"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  status: "pending" | "approved" | "edited" | "rejected";
  confidence: number;
  facultyNote?: string;
}

const MOCK_QUEUE: AIAnswer[] = [
  {
    id: "q1",
    questionText: "What is the difference between supervised and unsupervised learning?",
    aiAnswer:
      "Supervised learning uses labeled training data where both inputs and expected outputs are provided, allowing the model to learn a mapping function. Unsupervised learning works with unlabeled data and finds hidden patterns or groupings on its own — for example, clustering similar data points together.",
    studentName: "Rahul Sharma",
    courseTitle: "Introduction to Machine Learning",
    topicName: "ML Fundamentals",
    askedAt: "2024-01-15T09:30:00Z",
    status: "pending",
    confidence: 0.92,
  },
  {
    id: "q2",
    questionText: "Can you explain gradient descent in simple terms?",
    aiAnswer:
      "Gradient descent is an optimization algorithm used to minimize the loss function. Imagine you are on a hilly terrain and want to reach the lowest valley — gradient descent calculates the slope at your current position and takes a small step downhill. It repeats this process until it converges to the minimum.",
    studentName: "Priya Patel",
    courseTitle: "Deep Learning Essentials",
    topicName: "Optimization",
    askedAt: "2024-01-15T10:15:00Z",
    status: "pending",
    confidence: 0.88,
  },
  {
    id: "q3",
    questionText: "What is overfitting and how do we prevent it?",
    aiAnswer:
      "Overfitting occurs when a model learns the training data too well, including its noise and outliers, causing it to perform poorly on new data. Prevention techniques include: regularization (L1/L2), dropout layers, cross-validation, early stopping, and using more diverse training data.",
    studentName: "Ankit Verma",
    courseTitle: "Introduction to Machine Learning",
    topicName: "Model Evaluation",
    askedAt: "2024-01-15T11:00:00Z",
    status: "pending",
    confidence: 0.95,
  },
  {
    id: "q4",
    questionText: "How does a neural network learn?",
    aiAnswer:
      "A neural network learns through forward propagation (inputs pass through layers to produce predictions), loss calculation (comparing predictions with actual outputs), and backpropagation (adjusting weights using the gradient of the loss function). This cycle repeats across many training examples until the model converges.",
    studentName: "Sneha Kapoor",
    courseTitle: "Deep Learning Essentials",
    topicName: "Neural Networks",
    askedAt: "2024-01-14T15:45:00Z",
    status: "approved",
    confidence: 0.97,
  },
];

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

export default function VerificationQueuePage() {
  const [queue, setQueue] = useState<AIAnswer[]>(MOCK_QUEUE);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "edited" | "rejected">("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const pendingCount = queue.filter((q) => q.status === "pending").length;

  const filtered =
    filter === "all" ? queue : queue.filter((q) => q.status === filter);

  const handleAction = async (
    id: string,
    action: "approved" | "edited" | "rejected",
    updatedAnswer?: string,
    note?: string,
  ) => {
    setProcessing(id);
    await new Promise((r) => setTimeout(r, 400));
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: action,
              aiAnswer: updatedAnswer ?? item.aiAnswer,
              facultyNote: note ?? item.facultyNote,
            }
          : item,
      ),
    );
    setEditingId(null);
    setEditText("");
    setNoteText("");
    setProcessing(null);
  };

  const startEdit = (item: AIAnswer) => {
    setEditingId(item.id);
    setEditText(item.aiAnswer);
    setNoteText(item.facultyNote ?? "");
    setExpandedId(item.id);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="p-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">
            AI Quality Gate
          </p>
          <h1 className="text-4xl font-display font-bold tracking-tight text-white md:text-5xl">
            AI Answer{" "}
            <span className="text-lumina-highlight border-b-4 border-lumina-highlight/30">
              Verification Queue
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-400 leading-relaxed">
            Every AI-generated answer must be reviewed before students can see
            it. Approve, edit, or reject — you are the final quality gate.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Pending Review</p>
              <p className="mt-2 text-4xl font-bold text-amber-300">{pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-lumina-highlight/20 bg-lumina-highlight/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Approved Today</p>
              <p className="mt-2 text-4xl font-bold text-lumina-highlight">
                {queue.filter((q) => q.status === "approved").length}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Edited by Faculty</p>
              <p className="mt-2 text-4xl font-bold text-blue-300">
                {queue.filter((q) => q.status === "edited").length}
              </p>
            </div>
            <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Rejected</p>
              <p className="mt-2 text-4xl font-bold text-red-300">
                {queue.filter((q) => q.status === "rejected").length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Info banner */}
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-6 py-4 flex items-start gap-4">
        <Sparkles className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-200">
            Lumina Core Principle — Faculty is the only AI gatekeeper
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Students never receive unverified AI answers. Every response passes
            through this queue first. Your edits and rejections also train the AI
            to improve future responses.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "pending", "approved", "edited", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition-all",
              filter === f
                ? "border-lumina-highlight/40 bg-lumina-highlight/10 text-lumina-highlight"
                : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white",
            )}
          >
            {f}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-amber-400/20 px-1.5 py-0.5 text-amber-300">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Queue list */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-lumina-highlight/50" />
            <h3 className="text-lg font-semibold text-white">
              {filter === "pending" ? "All caught up!" : "Nothing here yet"}
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              {filter === "pending"
                ? "No pending AI answers waiting for your review."
                : `No ${filter} answers found.`}
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            const isEditing = editingId === item.id;
            const isProcessing = processing === item.id;

            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-3xl border bg-white/[0.03] transition-all",
                  item.status === "pending"
                    ? "border-amber-400/20"
                    : item.status === "approved"
                      ? "border-lumina-highlight/20"
                      : item.status === "edited"
                        ? "border-blue-400/20"
                        : "border-red-400/20",
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
                          item.status === "pending"
                            ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                            : item.status === "approved"
                              ? "border-lumina-highlight/30 bg-lumina-highlight/10 text-lumina-highlight"
                              : item.status === "edited"
                                ? "border-blue-400/30 bg-blue-400/10 text-blue-300"
                                : "border-red-400/30 bg-red-400/10 text-red-300",
                        )}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs text-gray-500">{item.courseTitle}</span>
                      {item.topicName && (
                        <span className="text-xs text-gray-600">• {item.topicName}</span>
                      )}
                    </div>

                    <p className="text-base font-semibold text-white">
                      {item.questionText}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {item.studentName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTimeAgo(item.askedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        AI confidence: {Math.round(item.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-gray-500 hover:text-white transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-6 space-y-5">
                    {/* AI Answer */}
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
                        AI Generated Answer
                      </p>
                      {isEditing ? (
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={6}
                          className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-lumina-highlight/50 focus:outline-none resize-none"
                        />
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-sm leading-relaxed text-gray-200">
                          {item.aiAnswer}
                        </div>
                      )}
                    </div>

                    {/* Faculty Note */}
                    {isEditing && (
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
                          Faculty Note (optional)
                        </p>
                        <input
                          type="text"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add a note explaining your edit..."
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-lumina-highlight/50 focus:outline-none"
                        />
                      </div>
                    )}

                    {item.facultyNote && !isEditing && (
                      <div className="rounded-2xl border border-blue-400/20 bg-blue-400/5 px-4 py-3">
                        <p className="text-xs text-gray-500">Faculty note: {item.facultyNote}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {item.status === "pending" || isEditing ? (
                      <div className="flex flex-wrap gap-3">
                        {!isEditing ? (
                          <>
                            <button
                              onClick={() => handleAction(item.id, "approved")}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-2 rounded-xl border border-lumina-highlight/30 bg-lumina-highlight/10 px-4 py-2 text-sm font-semibold text-lumina-highlight hover:bg-lumina-highlight/20 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => startEdit(item)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-400/20 transition-colors disabled:opacity-50"
                            >
                              <Edit2 className="h-4 w-4" />
                              Edit &amp; Approve
                            </button>
                            <button
                              onClick={() => handleAction(item.id, "rejected")}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-400/20 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                handleAction(item.id, "edited", editText, noteText)
                              }
                              disabled={isProcessing}
                              className="inline-flex items-center gap-2 rounded-xl border border-lumina-highlight/30 bg-lumina-highlight/10 px-4 py-2 text-sm font-semibold text-lumina-highlight hover:bg-lumina-highlight/20 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Save &amp; Approve Edited Answer
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditText("");
                                setNoteText("");
                              }}
                              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <RefreshCw className="h-3.5 w-3.5" />
                        This answer has been {item.status} and is{" "}
                        {item.status === "rejected"
                          ? "hidden from students."
                          : "visible to students."}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* AI training feedback note */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <h3 className="text-sm font-semibold text-white mb-1">AI Training Feedback Loop</h3>
        <p className="text-sm text-gray-400">
          Every edit and rejection you make is logged and used to improve future AI answers.
          The more you interact with this queue, the smarter Lumina becomes for your students.
        </p>
        <Link
          href="/faculty/analytics"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-lumina-highlight hover:text-white transition-colors"
        >
          View AI performance analytics
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
