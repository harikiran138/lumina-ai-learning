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
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function AssignmentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white">Loading...</div>}>
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
      const data = await api.getFacultyAssignments();
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
          <h1 className="text-3xl font-bold text-white mb-2">
            Assignments Manager
          </h1>
          <p className="text-gray-400">
            Create assignments, track submissions, and review student work.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 p-1 rounded-xl w-fit">
        <button
          onClick={() => handleTabChange("list")}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === "list"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          All Assignments
        </button>
        <button
          onClick={() => handleTabChange("create")}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
            activeTab === "create"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
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
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl">
        <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          No assignments yet
        </h3>
        <p className="text-gray-400 max-w-sm mx-auto mb-6">
          Get started by creating your first assignment.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-black/20">
              <th className="p-6 text-sm font-semibold text-gray-300">
                Assignment
              </th>
              <th className="p-6 text-sm font-semibold text-gray-300">
                Course
              </th>
              <th className="p-6 text-sm font-semibold text-gray-300">
                Due Date
              </th>
              <th className="p-6 text-sm font-semibold text-gray-300">
                Status
              </th>
              <th className="p-6 text-sm font-semibold text-gray-300 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {assignments.map((assignment: any) => (
              <tr
                key={assignment.id}
                className="group hover:bg-white/5 transition-colors"
              >
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-1">
                        {assignment.description}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-300 border border-white/10">
                    {assignment.course_name || assignment.course_id}
                  </span>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {new Date(assignment.due_date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 pl-6">
                    {new Date(assignment.due_date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">
                        {assignment.submission_count || 0}
                      </span>
                      <span className="text-xs text-gray-500">Submissions</span>
                    </div>
                  </div>
                </td>
                <td className="p-6 text-right">
                  <Link
                    href={`/faculty/assignments/${assignment.id}/submissions`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-all"
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
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "http://127.0.0.1:8000";

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
    <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
      <h2 className="text-2xl font-bold text-white mb-6">
        Create New Assignment
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Assignment Title
            </label>
            <input
              name="title"
              required
              placeholder="e.g. Calculus Chapter 1"
              className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Course
            </label>
            <select
              name="course_id"
              required
              defaultValue=""
              className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="" disabled>
                Select a course
              </option>
              {courses.map((course) => (
                <option
                  key={course.id}
                  value={course.id}
                  className="bg-gray-800"
                >
                  {course.name} {course.code ? `(${course.code})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Due Date & Time
          </label>
          <input
            name="due_date"
            type="datetime-local"
            required
            className="w-full md:w-1/2 p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description & Instructions
          </label>
          <textarea
            name="description"
            required
            rows={6}
            className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors resize-none"
            placeholder="Detailed instructions for the assignment..."
          ></textarea>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="animate-spin w-5 h-5" />}
            {loading ? "Creating..." : "Publish Assignment"}
          </button>
        </div>
      </form>
    </div>
  );
}
