"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, CheckCircle, Loader2 } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  course_id: string;
  description: string;
  due_date: string;
  created_by: string;
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setError(null);
      // Hardcoded student_id for demo
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE ||
          process.env.NEXT_PUBLIC_API_URL ||
          "http://127.0.0.1:8000"
        }/api/assignments/list?student_id=student_demo`,
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch assignments: ${res.statusText}`);
      }
      const data = await res.json();
      setAssignments(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    assignmentId: string,
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setSubmitting(assignmentId);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "assignment");
    formData.append("student_id", "student_demo"); // Mock user
    formData.append("assignment_id", assignmentId);

    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE ||
          process.env.NEXT_PUBLIC_API_URL ||
          "http://127.0.0.1:8000"
        }/api/assignments/submit`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (res.ok) {
        alert("Assignment submitted successfully!");
        // Refresh assignments to show updated status
        fetchAssignments();
      } else {
        alert("Submission failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading file.");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-2">My Assignments</h1>
      <p className="text-gray-400 mb-8">View and submit your course work.</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
        </div>
      ) : (
        <div className="grid gap-6">
          {assignments.length === 0 && (
            <p className="text-gray-400">No assignments due.</p>
          )}

          {assignments.map((asm: any) => (
            <div
              key={asm.id}
              className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row justify-between gap-6 hover:border-blue-500/30 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-900/40 text-blue-400 text-xs px-2 py-1 rounded uppercase tracking-wide font-semibold">
                    {asm.course_id}
                  </span>
                  <span className="text-gray-400 text-sm flex items-center gap-1">
                    Due: {new Date(asm.due_date).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {asm.title}
                </h2>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  {asm.description}
                </p>

                {asm.user_submission && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        Submitted on{" "}
                        {new Date(
                          asm.user_submission.submitted_at,
                        ).toLocaleString()}
                      </span>
                    </div>

                    {asm.user_submission.grade !== null && (
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 mt-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Grade</span>
                          <span className="text-2xl font-bold text-green-400">
                            {asm.user_submission.grade}/100
                          </span>
                        </div>
                        {asm.user_submission.feedback && (
                          <div className="text-sm text-gray-300">
                            <span className="text-gray-500 block mb-1">
                              Feedback:
                            </span>
                            {asm.user_submission.feedback}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 justify-center min-w-[200px]">
                {asm.user_submission ? (
                  <button
                    disabled
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Locked
                  </button>
                ) : (
                  <label
                    className={`
                                        flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-all font-medium text-sm
                                        ${
                                          submitting === asm.id
                                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
                                        }
                                    `}
                  >
                    {submitting === asm.id ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Submission
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      disabled={submitting === asm.id}
                      onChange={(e) => handleFileUpload(e, asm.id)}
                    />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
