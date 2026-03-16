"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface GradebookEntry {
  studentId: string;
  studentName: string;
  avatar: string;
  courseId: string;
  courseName: string;
  assignments: Array<{
    id: string;
    title: string;
    score: number | null;
    maxScore: number;
    status: "submitted" | "graded" | "late" | "missing";
    submittedAt: string | null;
  }>;
  overallGrade: number;
  progress: number;
  lastActive: string;
}

interface AssignmentColumn {
  id: string;
  title: string;
  dueDate: string;
  maxScore: number;
  submissionCount: number;
  averageScore: number;
}

export default function GradebookPage() {
  const [entries, setEntries] = useState<GradebookEntry[]>([]);
  const [assignments, setAssignments] = useState<AssignmentColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [courses, setCourses] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadGradebookData();
  }, []);

  const loadGradebookData = async () => {
    setIsLoading(true);
    try {
      // Fetch teacher courses and students
      const [coursesData, studentsData] = await Promise.all([
        api.getTeacherCourses(),
        api.getTeacherStudents(),
      ]);

      setCourses(coursesData?.map((c: any) => ({ id: c.id, name: c.title })) || []);

      // Mock assignments data
      const mockAssignments: AssignmentColumn[] = [
        {
          id: "a1",
          title: "Assignment 1: Introduction",
          dueDate: "2024-03-10",
          maxScore: 100,
          submissionCount: 45,
          averageScore: 78,
        },
        {
          id: "a2",
          title: "Assignment 2: Core Concepts",
          dueDate: "2024-03-17",
          maxScore: 100,
          submissionCount: 42,
          averageScore: 72,
        },
        {
          id: "a3",
          title: "Midterm Project",
          dueDate: "2024-03-24",
          maxScore: 150,
          submissionCount: 38,
          averageScore: 115,
        },
        {
          id: "a4",
          title: "Assignment 3: Advanced Topics",
          dueDate: "2024-04-01",
          maxScore: 100,
          submissionCount: 35,
          averageScore: 68,
        },
      ];
      setAssignments(mockAssignments);

      // Transform students into gradebook entries
      const gradebookEntries: GradebookEntry[] =
        studentsData?.map((student: any) => ({
          studentId: student.id,
          studentName: student.name,
          avatar:
            student.avatar ||
            `https://ui-avatars.com/api/?name=${student.name}&background=random`,
          courseId: student.courses?.[0]?.id || "",
          courseName: student.courses?.[0] || "General",
          assignments: mockAssignments.map((a) => ({
            id: a.id,
            title: a.title,
            score: Math.random() > 0.3 ? Math.floor(Math.random() * 40) + 60 : null,
            maxScore: a.maxScore,
            status:
              Math.random() > 0.3
                ? Math.random() > 0.5
                  ? "graded"
                  : "submitted"
                : "missing",
            submittedAt:
              Math.random() > 0.3
                ? new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
                : null,
          })),
          overallGrade: Math.floor(Math.random() * 30) + 70,
          progress: student.progress || student.averageProgress || 0,
          lastActive: student.lastActive || new Date().toISOString(),
        })) || [];

      setEntries(gradebookEntries);
    } catch (error) {
      console.error("Failed to load gradebook:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = entry.studentName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCourse =
      selectedCourse === "all" || entry.courseId === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  const handleExport = () => {
    const csvContent = [
      ["Student", "Course", "Overall Grade", "Progress", ...assignments.map((a) => a.title)],
      ...filteredEntries.map((entry) => [
        entry.studentName,
        entry.courseName,
        `${entry.overallGrade}%`,
        `${entry.progress}%`,
        ...entry.assignments.map((a) => (a.score !== null ? `${a.score}/${a.maxScore}` : "-")),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gradebook-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "text-yellow-400";
    if (percentage >= 60) return "text-amber-400";
    return "text-red-400";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "graded":
        return <CheckCircle className="w-4 h-4 text-yellow-400" />;
      case "submitted":
        return <Clock className="w-4 h-4 text-amber-400" />;
      case "late":
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case "missing":
        return <Minus className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gradebook</h1>
          <p className="text-gray-400">View and manage student grades across all courses</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500"
          />
        </div>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500"
        >
          <option value="all" className="bg-gray-800">All Courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id} className="bg-gray-800">
              {course.name}
            </option>
          ))}
        </select>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Assignment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="p-4 rounded-xl bg-white/5 border border-white/5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-400">
                Due {new Date(assignment.dueDate).toLocaleDateString()}
              </span>
            </div>
            <p className="font-medium text-white text-sm mb-2 truncate">{assignment.title}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                {assignment.submissionCount} submissions
              </span>
              <span
                className={cn(
                  "font-medium",
                  assignment.averageScore >= 80
                    ? "text-yellow-400"
                    : assignment.averageScore >= 60
                    ? "text-amber-400"
                    : "text-red-400"
                )}
              >
                Avg: {assignment.averageScore}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Gradebook Table */}
      <div className="glass-v2 border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-400 sticky left-0 bg-inherit z-10">
                  Student
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-400">
                  Course
                </th>
                <th className="px-4 py-4 text-center text-sm font-medium text-gray-400">
                  Overall
                </th>
                <th className="px-4 py-4 text-center text-sm font-medium text-gray-400">
                  Progress
                </th>
                {assignments.map((assignment) => (
                  <th
                    key={assignment.id}
                    className="px-4 py-4 text-center text-sm font-medium text-gray-400 min-w-[120px]"
                  >
                    <div className="truncate max-w-[120px]" title={assignment.title}>
                      {assignment.title}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-4 text-center text-sm font-medium text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => (
                  <tr key={entry.studentId} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4 sticky left-0 bg-inherit z-10">
                      <div className="flex items-center gap-3">
                        <img
                          src={entry.avatar}
                          alt={entry.studentName}
                          className="w-10 h-10 rounded-full object-cover border border-white/10"
                        />
                        <div>
                          <p className="font-medium text-white">{entry.studentName}</p>
                          <p className="text-xs text-gray-400">
                            Last active: {new Date(entry.lastActive).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">{entry.courseName}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={cn(
                          "text-lg font-bold",
                          entry.overallGrade >= 80
                            ? "text-yellow-400"
                            : entry.overallGrade >= 60
                            ? "text-amber-400"
                            : "text-red-400"
                        )}
                      >
                        {entry.overallGrade}%
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-white/10">
                          <div
                            className="h-2 rounded-full bg-amber-400"
                            style={{ width: `${entry.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400 w-10">{entry.progress}%</span>
                      </div>
                    </td>
                    {entry.assignments.map((assignment) => (
                      <td key={assignment.id} className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {assignment.score !== null ? (
                            <span
                              className={cn(
                                "font-medium",
                                getScoreColor(assignment.score, assignment.maxScore)
                              )}
                            >
                              {assignment.score}/{assignment.maxScore}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                          <div className="flex items-center gap-1">
                            {getStatusIcon(assignment.status)}
                          </div>
                        </div>
                      </td>
                    ))}
                    <td className="px-4 py-4 text-center">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <MoreHorizontal className="w-5 h-5 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5 + assignments.length}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-sm text-gray-400">Class Average</p>
              <p className="text-2xl font-bold text-yellow-400">
                {Math.round(
                  entries.reduce((sum, e) => sum + e.overallGrade, 0) / (entries.length || 1)
                )}
                %
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-400" />
            <div>
              <p className="text-sm text-gray-400">Pending Grading</p>
              <p className="text-2xl font-bold text-amber-400">
                {entries.reduce(
                  (sum, e) => {
                    return sum + e.assignments.filter((a) => a.status === "submitted").length;
                  },
                  0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-sm text-gray-400">At Risk</p>
              <p className="text-2xl font-bold text-red-400">
                {entries.filter((e) => e.overallGrade < 60).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
