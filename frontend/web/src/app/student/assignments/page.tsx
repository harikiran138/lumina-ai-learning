"use client";

import { useState, useEffect, Suspense } from "react";
import { 
  Upload, 
  CheckCircle, 
  Loader2, 
  FileText, 
  Clock, 
  Trophy, 
  ChevronRight,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function StudentAssignmentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white flex items-center gap-3"><Loader2 className="animate-spin" /> Loading...</div>}>
      <AssignmentsContent />
    </Suspense>
  );
}

function AssignmentsContent() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const data = await api.getStudentAssignments();
      setAssignments(data);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load assignments");
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

    try {
      setSubmitting(assignmentId);
      
      // In a real app, we would upload the file to Supabase Storage first.
      // For this spec, we simulate the submission with a fake URL.
      const payload = {
        content_url: `https://storage.lumina.ai/submissions/${file.name}`,
        text_content: `Submitted file: ${file.name}`,
      };

      await api.submitStudentAssignment(assignmentId, payload);
      toast.success("Assignment submitted successfully!");
      fetchAssignments();
    } catch (err: any) {
      console.error(err);
      toast.error("Error submitting assignment");
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-amber-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <FileText className="text-warning" />
            My Assignments
          </h1>
          <p className="text-text-muted">
            View upcoming deadlines and submit your work for grading.
          </p>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-32 bg-surface border border-border rounded-3xl backdrop-blur-xl">
          <CheckCircle className="w-16 h-16 text-success/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">All caught up!</h3>
          <p className="text-text-muted">You have no pending assignments at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((asm: any) => {
            const submission = asm.submission || asm.user_submission;
            const isSubmitted = !!submission;
            const normalizedScore =
              submission?.score ?? submission?.marks ?? submission?.grade;
            const isGraded = normalizedScore !== null && normalizedScore !== undefined;

            return (
              <div
                key={asm.id}
                className="group relative bg-surface border border-border rounded-3xl p-6 hover:bg-surface-elevated transition-all duration-300 backdrop-blur-xl flex flex-col h-full"
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {isGraded ? (
                    <div className="px-3 py-1 bg-success/10 text-success border border-success/20 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <Trophy size={14} />
                      GRADED
                    </div>
                  ) : isSubmitted ? (
                    <div className="px-3 py-1 bg-info/10 text-info border border-info/20 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle size={14} />
                      SUBMITTED
                    </div>
                  ) : (
                    <div className="px-3 py-1 bg-warning/10 text-warning border border-warning/20 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <Clock size={14} />
                      PENDING
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <div className="bg-warning/10 text-warning text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest w-fit mb-3 border border-warning/10">
                    {asm.course_name || asm.courseName || "Coursework"}
                  </div>
                  <h3 className="text-xl font-bold text-foreground group-hover:text-warning transition-colors mb-2">
                    {asm.title}
                  </h3>
                  <p className="text-sm text-text-muted line-clamp-2 leading-relaxed">
                    {asm.description}
                  </p>
                </div>

                <div className="mt-auto space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary flex items-center gap-1.5">
                      <Clock size={14} />
                      Due Date:
                    </span>
                    <span className="text-foreground font-medium">
                      {new Date(asm.due_date).toLocaleDateString()}
                    </span>
                  </div>

                  {isGraded ? (
                    <div className="bg-gradient-to-br from-success/10 to-success/5 p-4 rounded-2xl border border-success/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-success font-bold uppercase tracking-wider">Your Score</span>
                        <span className="text-2xl font-black text-foreground">{normalizedScore}<span className="text-sm text-success/50">/100</span></span>
                      </div>
                      {submission.feedback && (
                        <div className="text-xs text-text-muted italic">
                          "{submission.feedback}"
                        </div>
                      )}
                    </div>
                  ) : isSubmitted ? (
                    <div className="bg-surface p-4 rounded-2xl border border-border">
                      <div className="flex items-center justify-between mb-3 text-sm">
                        <span className="text-text-secondary">Working URL:</span>
                        <a 
                            href={submission.content_url} 
                            target="_blank" 
                            className="text-warning hover:underline flex items-center gap-1"
                        >
                            View Submission <ExternalLink size={12} />
                        </a>
                      </div>
                      <div className="text-[10px] text-text-muted uppercase font-bold tracking-widest text-center">
                        Waiting for faculty review
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 w-full py-3.5 bg-warning hover:bg-warning/80 text-warning-foreground font-bold rounded-2xl transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-95 disabled:opacity-50">
                      {submitting === asm.id ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                      ) : (
                        <Upload size={18} />
                      )}
                      {submitting === asm.id ? "Uploading..." : "Submit Assignment"}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, asm.id)}
                        disabled={!!submitting}
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
