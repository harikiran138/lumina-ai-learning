"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileText,
  User,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronLeft,
  Loader2,
  Save,
  MessageSquare,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function AssignmentSubmissionsPage() {
  const params = useParams();
  const assignmentId = params.id as string;

  return (
    <Suspense fallback={<div className="p-8 text-white"><Loader2 className="animate-spin" /> Loading...</div>}>
      <SubmissionsContent assignmentId={assignmentId} />
    </Suspense>
  );
}

function SubmissionsContent({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeValue, setGradeValue] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subList, assignmentsList] = await Promise.all([
          api.getAssignmentSubmissions(assignmentId),
          api.getAssignments()
        ]);
        setSubmissions(subList);
        const found = assignmentsList.find((a: any) => a.id === assignmentId);
        setAssignment(found);
      } catch (e) {
        console.error("Failed to fetch submissions", e);
        toast.error("Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [assignmentId]);

  const handleGradeSubmit = async (submissionId: string) => {
    try {
      await api.gradeSubmission(assignmentId, submissionId, { score: gradeValue, feedback });
      toast.success("Grade updated successfully!");
      setGradingId(null);
      // Refresh list
      const updated = await api.getAssignmentSubmissions(assignmentId);
      setSubmissions(updated);
    } catch (e) {
      console.error("Failed to update grade", e);
      toast.error("Failed to update grade");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ChevronLeft size={20} />
          Back to Assignments
        </button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {assignment?.title || "Assignment Submissions"}
            </h1>
            <p className="text-gray-400">
              Reviewing work and providing feedback for students.
            </p>
          </div>
          <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <span className="text-amber-500 font-bold">{submissions.length}</span>
            <span className="text-gray-400 ml-2">Total Submissions</span>
          </div>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-32 bg-white/5 rounded-3xl border border-white/10">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No submissions yet</h3>
          <p className="text-gray-400">Students haven't turned in this assignment yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Submissions List */}
          <div className="lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {submissions.map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  setGradingId(sub.id);
                  setGradeValue(sub.score ?? sub.marks ?? sub.grade ?? 0);
                  setFeedback(sub.feedback || "");
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  gradingId === sub.id
                    ? "bg-amber-500/20 border-amber-500/50 scale-[1.02]"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-black font-bold">
                    {(sub.student_name || sub.studentName || "Student").charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{sub.student_name || sub.studentName || "Student"}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(sub.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {(sub.score ?? sub.marks ?? sub.grade) !== null && (sub.score ?? sub.marks ?? sub.grade) !== undefined ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <Trophy size={14} />
                    Graded: {sub.score ?? sub.marks ?? sub.grade}/100
                  </div>
                ) : (
                  <div className="text-amber-500 text-sm font-medium flex items-center gap-2">
                    <AlertCircle size={14} />
                    Needs Grading
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Grading Area */}
          <div className="lg:col-span-2">
            {gradingId ? (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl sticky top-8">
                {(() => {
                  const sub = submissions.find(s => s.id === gradingId);
                  return (
                    <div className="space-y-8">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-1">
                            Review Submission
                          </h2>
                          <p className="text-gray-400">Student: {sub.student_name || sub.studentName || "Student"}</p>
                        </div>
                        <a
                          href={sub.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                        >
                          <ExternalLink size={18} />
                          View Document
                        </a>
                      </div>

                      {sub.text_content && (
                        <div className="p-6 bg-black/40 rounded-2xl border border-white/10">
                          <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Submission Content</h4>
                          <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                            {sub.text_content}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Trophy size={16} className="text-amber-500" />
                            Grade Score (0-100)
                          </label>
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={gradeValue}
                              onChange={(e) => setGradeValue(parseInt(e.target.value))}
                              className="flex-1 accent-amber-500"
                            />
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={gradeValue}
                              onChange={(e) => setGradeValue(parseInt(e.target.value))}
                              className="w-20 p-2 bg-black/40 border border-white/10 rounded-lg text-white text-center font-bold outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <MessageSquare size={16} className="text-amber-500" />
                            Feedback
                          </label>
                          <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Great work! Consider refining..."
                            rows={3}
                            className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500 transition-colors resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          onClick={() => handleGradeSubmit(sub.id)}
                          className="flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                        >
                           <Save size={20} />
                           Save Grade & Feedback
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="h-full min-h-[400px] bg-white/5 border border-white/10 border-dashed rounded-3xl flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Select a submission</h3>
                <p className="text-gray-400 max-w-xs">
                  Choose a student from the list on the left to review their work and provide a grade.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
