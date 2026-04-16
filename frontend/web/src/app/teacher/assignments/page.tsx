"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  PlusCircle,
  FileText,
  Calendar,
  Users,
  BarChart,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  Download,
  Eye,
} from "lucide-react";
import { api, getConfiguredApiBase } from "@/lib/api";
import { toast } from "sonner";

export default function AssignmentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-foreground">Loading...</div>}>
      <AssignmentsContent />
    </Suspense>
  );
}

function AssignmentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") === "create" ? "create" : "list";

  const [activeTab, setActiveTab] = useState<"list" | "create">(initialTab);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "create") setActiveTab("create");
    else setActiveTab("list");
  }, [searchParams]);

  const handleTabChange = (tab: "list" | "create") => {
    setActiveTab(tab);
    // Update URL without reload to match state
    const newParams = new URLSearchParams(searchParams.toString());
    if (tab === "list") newParams.delete("tab");
    else newParams.set("tab", "create");
    router.push(`?${newParams.toString()}`);
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const data = await api.getTeacherAssignments();
      setAssignments(data);
    } catch (e) {
      console.error("Failed to fetch assignments", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Assignments Manager
          </h1>
          <p className="text-text-muted">
            Create assignments, track submissions, and review student work.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-surface p-1 rounded-xl w-fit">
        <button
          onClick={() => handleTabChange("list")}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === "list"
              ? "bg-warning text-warning-foreground shadow-lg shadow-warning/20"
              : "text-text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          All Assignments
        </button>
        <button
          onClick={() => handleTabChange("create")}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
            activeTab === "create"
              ? "bg-warning text-warning-foreground shadow-lg shadow-warning/20"
              : "text-text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          <PlusCircle size={16} />
          Create New
        </button>
      </div>

      {activeTab === "list" ? (
        <AssignmentsList assignments={assignments} loading={loading} />
      ) : (
        <CreateAssignmentForm
          onSuccess={() => {
            handleTabChange("list");
            fetchAssignments();
          }}
        />
      )}
    </div>
  );
}

function AssignmentsList({
  assignments,
  loading,
}: {
  assignments: any[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-warning animate-spin" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12 bg-surface rounded-3xl border border-border backdrop-blur-xl">
        <div className="bg-surface w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-text-secondary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No assignments yet
        </h3>
        <p className="text-text-muted max-w-sm mx-auto mb-6">
          Get started by creating your first assignment.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-3xl overflow-hidden backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-background/20">
              <th className="p-6 text-sm font-semibold text-text-secondary">
                Assignment
              </th>
              <th className="p-6 text-sm font-semibold text-text-secondary">
                Course
              </th>
              <th className="p-6 text-sm font-semibold text-text-secondary">
                Due Date
              </th>
              <th className="p-6 text-sm font-semibold text-text-secondary">
                Status
              </th>
              <th className="p-6 text-sm font-semibold text-text-secondary text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assignments.map((assignment: any) => (
              <tr
                key={assignment.id}
                className="group hover:bg-surface-elevated transition-colors"
              >
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-warning/10 text-warning group-hover:bg-warning/20 transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-warning transition-colors">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-text-muted line-clamp-1">
                        {assignment.description}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface text-foreground border border-border">
                    {assignment.course_name || assignment.course_id}
                  </span>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2 text-foreground">
                    <Calendar className="w-4 h-4 text-text-secondary" />
                    {new Date(assignment.due_date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-text-secondary mt-1 pl-6">
                    {new Date(assignment.due_date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {assignment.submission_count || 0}
                      </span>
                      <span className="text-xs text-text-secondary">Submissions</span>
                    </div>
                  </div>
                </td>
                <td className="p-6 text-right">
                  <Link
                    href={`/teacher/assignments/${assignment.id}/submissions`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-warning-foreground bg-warning hover:bg-warning/80 rounded-lg transition-all"
                  >
                    <Eye size={16} />
                    View Submissions
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateAssignmentForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const apiBase = getConfiguredApiBase();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const u = await api.getCurrentUser();
        const data = await api.listCourses(u?.deptId || undefined);
        setCourses(data);
      } catch (e) {
        console.error("Failed to fetch courses", e);
      }
    };
    fetchCourses();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!apiBase) {
      toast.error("Assignment API is not configured for this deployment.");
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append("created_by", "Teacher");

    try {
      const payload = {
        title: String(formData.get("title") || ""),
        course_id: String(formData.get("course_id") || ""),
        description: String(formData.get("description") || ""),
        due_date: String(formData.get("due_date") || ""),
      };

      const result = await api.createAssignment(payload);

      if (result) {
        toast.success("Assignment Created Successfully!");
        (e.target as HTMLFormElement).reset();
        onSuccess();
      } else {
        toast.error("Failed to create assignment");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-surface border border-border rounded-3xl p-8 backdrop-blur-xl">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Create New Assignment
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Assignment Title
            </label>
            <input
              name="title"
              required
              placeholder="e.g. Calculus Chapter 1"
              className="w-full p-3 bg-background/20 border border-border rounded-xl text-foreground focus:outline-none focus:border-warning transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Course
            </label>
            <select
              name="course_id"
              required
              defaultValue=""
              className="w-full p-3 bg-background/20 border border-border rounded-xl text-foreground focus:outline-none focus:border-warning transition-colors"
            >
              <option value="" disabled>
                Select a course
              </option>
              {courses.map((course) => (
                <option
                  key={course.id}
                  value={course.id}
                  className="bg-background"
                >
                  {course.name} {course.code ? `(${course.code})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">
            Due Date & Time
          </label>
          <input
            name="due_date"
            type="datetime-local"
            required
            className="w-full md:w-1/2 p-3 bg-background/20 border border-border rounded-xl text-foreground focus:outline-none focus:border-warning transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">
            Description & Instructions
          </label>
          <textarea
            name="description"
            required
            rows={6}
            className="w-full p-3 bg-background/20 border border-border rounded-xl text-foreground focus:outline-none focus:border-warning transition-colors resize-none"
            placeholder="Detailed instructions for the assignment..."
          ></textarea>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-warning to-warning hover:from-warning/80 hover:to-warning/80 text-warning-foreground font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="animate-spin w-5 h-5" />}
            {loading ? "Creating..." : "Publish Assignment"}
          </button>
        </div>
      </form>
    </div>
  );
}
