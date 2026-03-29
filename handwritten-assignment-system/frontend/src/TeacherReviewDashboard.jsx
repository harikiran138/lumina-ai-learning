import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:8000/api";

// ── Status badge ───────────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending:        "bg-gray-100 text-gray-700",
  processing:     "bg-blue-100 text-blue-700",
  needs_rescan:   "bg-red-100 text-red-700",
  ai_evaluated:   "bg-yellow-100 text-yellow-700",
  teacher_review: "bg-purple-100 text-purple-700",
  finalized:      "bg-green-100 text-green-700",
  published:      "bg-emerald-100 text-emerald-700",
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || "bg-gray-100 text-gray-600"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

// ── Confidence bar ─────────────────────────────────────────────────────────
function ConfBar({ value, label }) {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span className="w-20 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-mono">{pct}%</span>
    </div>
  );
}

// ── Question card ──────────────────────────────────────────────────────────
function QuestionCard({ item, onAccept, onOverride }) {
  const [mode, setMode]       = useState("view");   // "view" | "override"
  const [score, setScore]     = useState("");
  const [feedback, setFeedback] = useState("");
  const [reason, setReason]   = useState("");
  const [saving, setSaving]   = useState(false);

  const isResolved = ["accepted", "overridden"].includes(item.status);

  const handleAccept = async () => {
    setSaving(true);
    await onAccept(item.sq_id);
    setSaving(false);
  };

  const handleOverride = async () => {
    const s = parseFloat(score);
    if (isNaN(s) || s < 0 || s > item.max_marks) {
      alert(`Score must be between 0 and ${item.max_marks}`);
      return;
    }
    setSaving(true);
    await onOverride(item.sq_id, { teacher_score: s, teacher_feedback: feedback, override_reason: reason });
    setSaving(false);
    setMode("view");
  };

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${isResolved ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-white"}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-800">Q{item.question_number}</span>
          <span className="text-xs text-gray-500 max-w-xs truncate">{item.question_text}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={item.status} />
          {item.ocr_is_flagged && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">⚠ Low OCR confidence</span>
          )}
          <span className="text-sm font-semibold text-gray-700">
            {item.final_score ?? item.ai_score ?? "—"} / {item.max_marks}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-0 divide-x divide-gray-100">
        {/* Left: scan + OCR */}
        <div className="p-4 space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Student's handwriting</p>
          {item.segment_image_url ? (
            <img
              src={`${API.replace("/api", "")}${item.segment_image_url}`}
              alt={`Q${item.question_number} scan`}
              className="w-full rounded-lg border border-gray-200 object-contain max-h-48"
            />
          ) : (
            <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">No image</div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">OCR transcript</p>
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 min-h-[60px] font-mono leading-relaxed border border-gray-100">
              {item.ocr_text || <span className="text-gray-400 italic">No text extracted</span>}
            </div>
            <div className="mt-2 space-y-1">
              <ConfBar value={item.ocr_confidence} label="OCR conf." />
            </div>
          </div>
        </div>

        {/* Right: AI result + teacher actions */}
        <div className="p-4 space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">AI evaluation</p>

          {item.ai_score !== null && item.ai_score !== undefined ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-800">{item.ai_score}</span>
                <span className="text-gray-400 text-sm">/ {item.max_marks}</span>
              </div>
              <ConfBar value={item.ai_confidence} label="AI conf." />

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Reasoning</p>
                <p className="text-xs text-gray-600 leading-relaxed bg-blue-50 rounded-lg p-2 border border-blue-100">
                  {item.ai_reasoning}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Student feedback</p>
                <p className="text-xs text-gray-600 leading-relaxed">{item.ai_feedback}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">AI evaluation pending…</p>
          )}

          {/* Teacher actions */}
          {!isResolved && item.ai_score !== null && (
            <div className="pt-2 border-t border-gray-100 space-y-2">
              {mode === "view" ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleAccept}
                    disabled={saving}
                    className="flex-1 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
                  >
                    {saving ? "…" : "✓ Accept"}
                  </button>
                  <button
                    onClick={() => { setScore(String(item.ai_score)); setMode("override"); }}
                    className="flex-1 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    ✎ Override
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 w-16 shrink-0">Score</label>
                    <input
                      type="number" min="0" max={item.max_marks} step="0.5"
                      value={score} onChange={e => setScore(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-gray-400">/ {item.max_marks}</span>
                  </div>
                  <textarea
                    placeholder="Feedback for student…"
                    value={feedback} onChange={e => setFeedback(e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs resize-none"
                  />
                  <input
                    placeholder="Reason for override (optional, for audit log)"
                    value={reason} onChange={e => setReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleOverride} disabled={saving}
                      className="flex-1 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 disabled:opacity-50 font-medium">
                      {saving ? "…" : "Save override"}
                    </button>
                    <button onClick={() => setMode("view")}
                      className="py-1.5 px-3 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isResolved && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.status === "overridden" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                  {item.status === "overridden" ? "✎ Teacher override" : "✓ AI accepted"}
                </span>
                <span className="text-sm font-bold text-gray-800">Final: {item.final_score} / {item.max_marks}</span>
              </div>
              {item.teacher_feedback && (
                <p className="text-xs text-gray-500 mt-1 italic">"{item.teacher_feedback}"</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────
export default function TeacherReviewDashboard() {
  const [submissionId, setSubmissionId] = useState("DEMO-001");
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [finalizing, setFinalizing] = useState(false);

  // Demo mode: generate mock data when backend not available
  const loadDemoData = useCallback(() => {
    setData({
      submission_id: "DEMO-001",
      student_id: "student-42",
      status: "ai_evaluated",
      ai_total_score: 17.5,
      final_score: null,
      processing_log: [
        "[2024-01-15T10:00:01] Loading submission file",
        "[2024-01-15T10:00:02] Quality check: OK",
        "[2024-01-15T10:00:03] Segmented into 3 sections",
        "[2024-01-15T10:00:08] Q1 OCR: conf=0.91, flagged=False",
        "[2024-01-15T10:00:12] Q2 OCR: conf=0.58, flagged=True",
        "[2024-01-15T10:00:16] Q3 OCR: conf=0.88, flagged=False",
        "[2024-01-15T10:00:35] Pipeline complete — ready for teacher review",
      ],
      questions: [
        {
          sq_id: "sq-1", question_number: 1, question_text: "Explain Newton's second law of motion.",
          max_marks: 10, status: "ai_graded",
          ocr_text: "Newton's second law states that Force equals mass times acceleration (F=ma). The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass.",
          ocr_confidence: 0.91, ocr_is_flagged: false,
          ai_score: 8.5, ai_reasoning: "Student correctly states the law and provides the formula. Partially explains proportionality but lacks mention of direction (vector nature). Good understanding demonstrated.",
          ai_feedback: "Well done! Remember that force and acceleration are both vector quantities — mentioning direction would earn full marks.",
          ai_confidence: 0.88, criteria_scores: { "Formula": 3, "Explanation": 3.5, "Examples": 1, "Units": 1 },
          final_score: null, teacher_score: null, teacher_feedback: null,
          segment_image_url: null,
        },
        {
          sq_id: "sq-2", question_number: 2, question_text: "Derive the equation for kinetic energy.",
          max_marks: 15, status: "flagged",
          ocr_text: "KE = 1/2 mv2  using work energy theorm  W = F.d = ma.d  sinc v2 = u2 + 2as  therfore KE = 1/2mv2",
          ocr_confidence: 0.58, ocr_is_flagged: true,
          ai_score: 9.0, ai_reasoning: "Student shows correct derivation using work-energy theorem. Some spelling errors (OCR confidence low — may be handwriting issue). Steps are logically connected. Missing final statement of units.",
          ai_feedback: "Good derivation! Clearly show each step and don't forget to state the SI unit (Joules) in your final answer.",
          ai_confidence: 0.71, criteria_scores: {},
          final_score: null, teacher_score: null, teacher_feedback: null,
          segment_image_url: null,
        },
        {
          sq_id: "sq-3", question_number: 3, question_text: "A 5kg object accelerates at 3m/s². Find the force applied.",
          max_marks: 5, status: "ai_graded",
          ocr_text: "F = ma = 5 × 3 = 15 N",
          ocr_confidence: 0.95, ocr_is_flagged: false,
          ai_score: 5.0, ai_reasoning: "Perfect answer. Correct formula, correct substitution, correct answer with units.",
          ai_feedback: "Perfect! Full marks.",
          ai_confidence: 0.99, criteria_scores: { "Formula": 1, "Substitution": 2, "Answer with units": 2 },
          final_score: null, teacher_score: null, teacher_feedback: null,
          segment_image_url: null,
        },
      ],
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/submissions/${submissionId}/review`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      // Load demo data if backend unavailable
      loadDemoData();
    }
    setLoading(false);
  }, [submissionId, loadDemoData]);

  useEffect(() => { fetchData(); }, []);

  const handleAccept = async (sqId) => {
    try {
      await fetch(`${API}/submissions/${submissionId}/questions/${sqId}/accept`, { method: "PATCH" });
    } catch {}
    // Update local state optimistically
    setData(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.sq_id === sqId ? { ...q, status: "accepted", final_score: q.ai_score } : q
      )
    }));
  };

  const handleOverride = async (sqId, body) => {
    try {
      await fetch(`${API}/submissions/${submissionId}/questions/${sqId}/override`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {}
    setData(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.sq_id === sqId ? { ...q, status: "overridden", final_score: body.teacher_score, teacher_feedback: body.teacher_feedback } : q
      )
    }));
  };

  const handleFinalize = async () => {
    const unresolved = data.questions.filter(q => !["accepted", "overridden"].includes(q.status));
    if (unresolved.length) {
      alert(`Please review all questions first. ${unresolved.length} question(s) pending.`);
      return;
    }
    setFinalizing(true);
    try {
      await fetch(`${API}/submissions/${submissionId}/finalize`, { method: "POST" });
    } catch {}
    const total = data.questions.reduce((s, q) => s + (q.final_score ?? 0), 0);
    setData(prev => ({ ...prev, status: "published", final_score: total }));
    setFinalizing(false);
  };

  const resolvedCount = data?.questions?.filter(q => ["accepted", "overridden"].includes(q.status)).length ?? 0;
  const totalQ = data?.questions?.length ?? 0;
  const computedFinal = data?.questions?.reduce((s, q) => s + (q.final_score ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Handwriting Review Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">AI-assisted grading — teacher has final say</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={submissionId} onChange={e => setSubmissionId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-48"
            placeholder="Submission ID"
          />
          <button onClick={fetchData} className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            Load
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading submission…</div>
        </div>
      )}

      {data && (
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
          {/* Submission summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-gray-500">Student</p>
                  <p className="text-sm font-semibold text-gray-800">{data.student_id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <StatusBadge status={data.status} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">AI suggested total</p>
                  <p className="text-sm font-semibold text-gray-800">{data.ai_total_score ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Progress</p>
                  <p className="text-sm font-semibold text-gray-800">{resolvedCount} / {totalQ} reviewed</p>
                </div>
                {data.final_score !== null && data.final_score !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500">Final grade</p>
                    <p className="text-lg font-bold text-green-700">{data.final_score}</p>
                  </div>
                )}
              </div>

              {data.status !== "published" && (
                <button
                  onClick={handleFinalize}
                  disabled={finalizing || resolvedCount < totalQ}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {finalizing ? "Publishing…" : "Publish grade"}
                </button>
              )}
              {data.status === "published" && (
                <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">
                  ✓ Grade published to student
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${totalQ ? (resolvedCount / totalQ) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Processing log (collapsible) */}
          <details className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <summary className="px-5 py-3 text-sm text-gray-600 cursor-pointer hover:bg-gray-50 font-medium">
              Processing log ({data.processing_log?.length ?? 0} entries)
            </summary>
            <div className="px-5 pb-4 space-y-0.5">
              {data.processing_log?.map((line, i) => (
                <p key={i} className="text-xs font-mono text-gray-500">{line}</p>
              ))}
            </div>
          </details>

          {/* Question cards */}
          <div className="space-y-4">
            {data.questions?.map(item => (
              <QuestionCard
                key={item.sq_id}
                item={item}
                onAccept={handleAccept}
                onOverride={handleOverride}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
