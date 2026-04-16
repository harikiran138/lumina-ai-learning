"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function StudentGradesPage() {
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getStudentGrades();
        setGrades(res);
      } catch (err: any) {
        setError(err?.message || "Failed to load grades");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto text-foreground space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Results</h1>
        <p className="text-text-muted">Your graded submissions and feedback.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin w-8 h-8 text-warning" />
        </div>
      ) : error ? (
        <div className="bg-danger/10 border border-danger/50 text-danger p-4 rounded-xl">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          {grades.map((grade: any) => (
            <div
              key={grade.submissionId}
              className="bg-surface border border-border rounded-2xl p-5"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{grade.assignmentTitle}</h3>
                  <p className="text-sm text-text-muted">{grade.courseName}</p>
                </div>
                <div className="text-2xl font-bold text-success">
                  {grade.marks ?? "-"}
                </div>
              </div>
              {grade.feedback && (
                <p className="text-sm text-foreground mt-3">{grade.feedback}</p>
              )}
            </div>
          ))}
          {grades.length === 0 && (
            <div className="text-text-muted">No graded submissions yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
