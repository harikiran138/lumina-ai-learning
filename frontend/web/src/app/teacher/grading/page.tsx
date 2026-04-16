"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  BookOpen,
  ArrowRight,
  Loader2,
  ClipboardCheck,
  AlertTriangle,
  Search,
  Filter,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TeacherAssignmentCard {
  id: string;
  title: string;
  courseName: string;
  dueDate?: string | null;
  submissionCount: number;
  pendingGrading: number;
  status: "scheduled" | "due-soon" | "overdue";
  href: string;
}

export default function GradingPage() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<TeacherAssignmentCard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const dashboardData = await api.getDashboardData("teacher");
        setAssignments(dashboardData.recentAssignments || []);
      } catch (e) {
        console.error("Failed to fetch grading tasks", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const pendingGradingTasks = assignments.filter((a) => a.pendingGrading > 0);
  const filteredTasks = pendingGradingTasks.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.courseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <ClipboardCheck className="text-warning" />
            Grading Queue
          </h1>
          <p className="text-text-muted">
            All assignments with pending student submissions that need review.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
          <input
            type="text"
            placeholder="Search assignments or courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-xl text-foreground focus:outline-none focus:border-warning transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-warning animate-spin" />
          <p className="text-text-muted font-medium">Fetching grading queue...</p>
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid gap-6">
          {filteredTasks.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between p-6 rounded-3xl bg-surface border border-border hover:bg-surface-elevated transition-all duration-300 group"
            >
              <div className="flex items-center gap-6">
                <div
                  className={cn(
                    "p-4 rounded-2xl",
                    assignment.status === "overdue"
                      ? "bg-danger/10 text-danger"
                      : "bg-warning/10 text-warning",
                  )}
                >
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground flex items-center gap-2 text-xl">
                    {assignment.title}
                    {assignment.status === "overdue" && (
                      <span className="px-2 py-0.5 rounded-full bg-danger/20 text-danger text-[10px] font-bold uppercase tracking-widest">
                        Overdue
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-text-muted flex items-center gap-2 mt-1">
                    <BookOpen className="w-4 h-4" />
                    {assignment.courseName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <div className="text-right">
                  <p className="text-3xl font-bold text-foreground tracking-tight">
                    {assignment.pendingGrading}
                  </p>
                  <p className="text-[10px] text-text-secondary uppercase font-black tracking-widest">
                    Submissions
                  </p>
                </div>
                <Link
                  href={assignment.href}
                  className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-warning text-black text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-warning/20 group-hover:translate-x-1"
                >
                  Grade Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center p-6 bg-surface border border-dashed border-border rounded-[3rem]">
          <ClipboardCheck className="w-16 h-16 text-text-secondary mb-4" />
          <h3 className="text-2xl font-semibold text-foreground mb-2">Queue is empty</h3>
          <p className="text-text-muted max-w-md">
            No pending submissions require your attention. Students have either not submitted yet or all grading is complete.
          </p>
          <Link 
            href="/teacher/dashboard"
            className="mt-8 px-6 py-2 bg-surface hover:bg-surface-elevated text-foreground rounded-xl transition-all border border-border"
          >
            Back to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
