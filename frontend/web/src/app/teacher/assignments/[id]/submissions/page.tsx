"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  User,
  Clock,
  Loader2,
  Sparkles,
  X,
  CheckCircle,
  BarChart2,
  BookOpen,
} from "lucide-react";
import { api } from "@/lib/api";

export default function AssignmentSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeResult, setGradeResult] = useState<any | null>(null);
  const [editingScore, setEditingScore] = useState<number | string>("");
  const [editingFeedback, setEditingFeedback] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [submissionReport, setSubmissionReport] = useState<any | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [coursePlan, setCoursePlan] = useState<any | null>(null);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseSaving, setCourseSaving] = useState(false);
  const [savedCourseId, setSavedCourseId] = useState<string | null>(null);
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "http://127.0.0.1:8000";

  useEffect(() => {
    fetchSubmissions();
    fetchAnalytics();
  }, [assignmentId]);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(
        `${apiBase}/api/assignments/${assignmentId}/submissions`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (e) {
      console.error("Failed to fetch submissions", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const res = await fetch(
        `${apiBase}/api/assignments/${assignmentId}/analytics`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error("Failed to fetch assignment analytics", e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleGrade = async (submissionId: string) => {
    setGradingId(submissionId);
    setGradeResult(null);
    try {
      const res = await fetch(
        `${apiBase}/api/assignments/${assignmentId}/submissions/${submissionId}/grade`,
        {
          method: "POST",
        },
      );
      if (res.ok) {
        const data = await res.json();
        setGradeResult(data);
        setEditingScore(data.score);
        setEditingFeedback(data.feedback);
        fetchSubmissions(); // specific refresh
      } else {
        alert("Grading failed. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Error during AI grading");
    } finally {
      setGradingId(null);
    }
  };

  const handleSaveGrade = async () => {
    if (!gradeResult || !gradeResult.submissionId) return; // We need submissionId in gradeResult or separate state

    setSaving(true);
    try {
      const res = await fetch(
        `${apiBase}/api/assignments/${assignmentId}/submissions/${gradeResult.submissionId}/score`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: Number(editingScore),
            feedback: editingFeedback,
          }),
        },
      );

      if (res.ok) {
        alert("Score updated successfully!");
        setGradeResult(null);
        fetchSubmissions();
      } else {
        alert("Failed to update score");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating score");
    } finally {
      setSaving(false);
    }
  };

  const getFileUrl = (filePath: string | null | undefined) => {
    if (!filePath) return "#";
    const filename = filePath.split(/[\\/]/).pop();
    return `${apiBase}/uploads/${filename}`;
  };

  const handleViewReport = async (submissionId: string) => {
    setReportLoading(true);
    setSubmissionReport(null);
    setCoursePlan(null);
    try {
      const res = await fetch(
        `${apiBase}/api/assignments/${assignmentId}/submissions/${submissionId}/report`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = await res.json();
        setSubmissionReport(data);
      } else {
        alert("Failed to load submission report");
      }
    } catch (e) {
      console.error("Failed to load submission report", e);
    } finally {
      setReportLoading(false);
    }
  };

  const handleGenerateCoursePlan = async (submissionId: string) => {
    setCourseLoading(true);
    setCoursePlan(null);
    setSavedCourseId(null);
    try {
      const res = await fetch(
        `${apiBase}/api/ai/generate-course-from-assignment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignment_id: assignmentId,
            submission_id: submissionId,
            modules: 4,
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        setCoursePlan(data);
      } else {
        const txt = await res.text();
        console.error("Course generation failed", txt);
        alert("AI course generation failed. See console for details.");
      }
    } catch (e) {
      console.error("Error generating course", e);
      alert("Error generating course");
    } finally {
      setCourseLoading(false);
    }
  };

  const handleSaveCourseFromPlan = async () => {
    if (!coursePlan) return;
    setCourseSaving(true);
    try {
      // Simple 1-module course built from outline
      const modules = [
        {
          id: `mod-${Date.now()}`,
          title: coursePlan.title || "Personalized Plan",
          duration: `${(coursePlan.outline?.length || 4) * 15} min`,
          lessons: (coursePlan.outline || []).map(
            (item: string, idx: number) => ({
              id: `less-${Date.now()}-${idx}`,
              title: item.replace(/\s*-\s*.*/, ""),
              type: "text",
              duration: "15 min",
              content: JSON.stringify({
                goal: `Master: ${item}`,
                content: [{ type: "paragraph", content: item }],
              }),
            }),
          ),
        },
      ];

      const result = await api.createCourse({
        title: coursePlan.title || "Personalized Course",
        description:
          coursePlan.description || "AI-generated personalized learning path",
        modules,
        image: "https://placehold.co/400x320/0a0a0a/FFF?text=Lumina+Course",
      });

      if (result.success && result.courseId) {
        setSavedCourseId(result.courseId);
        alert("Personalized course saved as draft in Courses.");
      } else {
        alert("Failed to save course draft.");
      }
    } catch (e) {
      console.error("Error saving course from plan", e);
      alert("Error saving course draft.");
    } finally {
      setCourseSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 relative">
      <div className="flex items-center gap-4">
        <Link
          href="/teacher/assignments"
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Submissions</h1>
          <p className="text-gray-400">
            Assignment ID:{" "}
            <span className="font-mono text-amber-500">{assignmentId}</span>
          </p>
        </div>
      </div>

      {/* Analytics summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
              Submissions
            </div>
            <div className="text-2xl font-bold text-white">
              {analytics?.submission_count ?? 0}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <User className="w-5 h-5" />
          </div>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
              Avg Score
            </div>
            <div className="text-2xl font-bold text-white">
              {analytics?.avg_grade !== null &&
              analytics?.avg_grade !== undefined
                ? `${analytics.avg_grade.toFixed(1)}/100`
                : "--"}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-green-500/10 text-green-400">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
              Graded
            </div>
            <div className="text-2xl font-bold text-white">
              {analytics?.graded_count ?? 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Ungraded: {analytics?.ungraded_count ?? 0}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl">
          <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No submissions yet
          </h3>
          <p className="text-gray-400">
            Students haven't submitted any work for this assignment.
          </p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-black/20">
                  <th className="p-6 text-sm font-semibold text-gray-300">
                    Student
                  </th>
                  <th className="p-6 text-sm font-semibold text-gray-300">
                    Submitted At
                  </th>
                  <th className="p-6 text-sm font-semibold text-gray-300">
                    File
                  </th>
                  <th className="p-6 text-sm font-semibold text-gray-300">
                    Status
                  </th>
                  <th className="p-6 text-sm font-semibold text-gray-300">
                    Score
                  </th>
                  <th className="p-6 text-sm font-semibold text-gray-300 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {submissions.map((sub: any) => (
                  <tr
                    key={sub.id}
                    className="group hover:bg-white/5 transition-colors"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                          {sub.student_id
                            ? sub.student_id.substring(0, 2).toUpperCase()
                            : "ST"}
                        </div>
                        <span className="font-medium text-white">
                          {sub.student_id}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {new Date(
                          sub.timestamp || sub.submitted_at,
                        ).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-gray-300 font-mono text-xs">
                        <FileText className="w-4 h-4 text-gray-500" />
                        {sub.file_path
                          ? sub.file_path.split(/[\\/]/).pop()
                          : "No File"}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        <CheckCircle className="w-3 h-3" />
                        {sub.status || "Locked"}
                      </span>
                    </td>
                    <td className="p-6">
                      {sub.grade !== null ? (
                        <span className="text-xl font-bold text-green-400">
                          {sub.grade}/100
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">--</span>
                      )}
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleGrade(sub.id)}
                          disabled={gradingId === sub.id}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-all disabled:opacity-50"
                        >
                          {gradingId === sub.id ? (
                            <Loader2 className="animate-spin w-4 h-4" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          {sub.grade !== null ? "Regrade" : "AI Grade"}
                        </button>
                        {sub.grade !== null && (
                          <button
                            onClick={() => handleViewReport(sub.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-all"
                          >
                            Details
                          </button>
                        )}
                        {sub.grade !== null && (
                          <button
                            onClick={() => {
                              setGradeResult({
                                submissionId: sub.id,
                                score: sub.grade,
                                feedback: sub.feedback,
                                ocr_text: "View OCR from AI Grade to see text", // Simplification as we don't have OCR text in list view
                                details: "Existing Grade",
                              });
                              setEditingScore(sub.grade);
                              setEditingFeedback(sub.feedback || "");
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                          >
                            Edit
                          </button>
                        )}
                        <a
                          href={getFileUrl(sub.file_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-black bg-amber-500 hover:bg-amber-400 rounded-lg transition-all"
                        >
                          <Download size={16} />
                          View
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grading Result Modal */}
      {gradeResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="text-purple-400" />
                  AI Grading Results
                </h2>
                <button
                  onClick={() => setGradeResult(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-sm text-gray-400 mb-1">
                    Overall Score (Editable)
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editingScore}
                      onChange={(e) => setEditingScore(e.target.value)}
                      className="text-4xl font-bold text-green-400 bg-transparent border-b border-white/20 w-32 focus:outline-none focus:border-green-400"
                    />
                    <span className="text-xl text-gray-500">/100</span>
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-sm text-gray-400 mb-1">
                    Confidence / Status
                  </div>
                  <div className="text-lg font-medium text-white">
                    {gradeResult.details}
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Feedback (Editable)
                </h3>
                <textarea
                  value={editingFeedback}
                  onChange={(e) => setEditingFeedback(e.target.value)}
                  rows={4}
                  className="w-full bg-black/20 text-gray-300 leading-relaxed p-3 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">
                  OCR Extracted Text
                </h3>
                <div className="font-mono text-sm text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto bg-black p-3 rounded-lg border border-white/5">
                  {gradeResult.ocr_text || "No text extracted."}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setGradeResult(null)}
                    className="px-6 py-2 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveGrade}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {saving && <Loader2 className="animate-spin w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Report + Personalized Course Modal */}
      {submissionReport && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-950 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <BarChart2 className="text-amber-400" />
                    Submission Report
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    Assignment: {submissionReport.assignment?.title} • Student:{" "}
                    {submissionReport.submission?.student_id}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSubmissionReport(null);
                    setCoursePlan(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Score and level */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">Score</div>
                  <div className="text-3xl font-bold text-green-400">
                    {submissionReport.score ?? "--"}
                    <span className="text-lg text-gray-400">/100</span>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">Level</div>
                  <div className="text-xl font-semibold text-white capitalize">
                    {submissionReport.level ?? "N/A"}
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">Status</div>
                  <div className="text-sm text-gray-300">
                    {submissionReport.submission?.status ?? "unknown"}
                  </div>
                </div>
              </div>

              {/* Feedback & OCR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-200 mb-2">
                    AI Feedback
                  </h3>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap min-h-[4rem]">
                    {submissionReport.feedback || "No feedback available."}
                  </p>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-200 mb-2">
                    OCR Text (Student Work)
                  </h3>
                  <div className="font-mono text-xs text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto bg-black/60 p-3 rounded-lg border border-white/5">
                    {submissionReport.ocr_text || "No OCR text stored."}
                  </div>
                </div>
              </div>

              {/* Personalized course generation */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">
                      AI Personalized Course Plan
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleGenerateCoursePlan(
                          submissionReport.submission?.id,
                        )
                      }
                      disabled={courseLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50"
                    >
                      {courseLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {courseLoading ? "Generating..." : "Generate Plan"}
                    </button>
                    {coursePlan && (
                      <button
                        onClick={handleSaveCourseFromPlan}
                        disabled={courseSaving}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 border border-white/20 transition-colors disabled:opacity-50"
                      >
                        {courseSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <SaveIcon />
                        )}
                        {courseSaving ? "Saving..." : "Save as Draft Course"}
                      </button>
                    )}
                  </div>
                </div>
                {coursePlan && (
                  <div className="mt-2 text-left space-y-2">
                    <div className="font-semibold text-white">
                      {coursePlan.title}
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      {coursePlan.description}
                    </p>
                    <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                      {coursePlan.outline?.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                    {savedCourseId && (
                      <p className="text-[10px] text-emerald-400 mt-2">
                        Saved as draft course. You can manage it under Teacher →
                        Courses.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SaveIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
