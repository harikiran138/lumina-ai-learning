"use client";

import { Users, Search, Filter, Mail, MoreVertical, Eye, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  courses: string[];
  progress: number;
  averageProgress: number;
  averageMastery: number;
  riskLevel: string;
  lastActive: string;
  weakTopics: string[];
  status: "on-track" | "watch" | "needs-attention";
}

export default function TeacherStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRisk, setFilterRisk] = useState<"all" | "high" | "medium" | "low">("all");

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      const data = await api.getTeacherStudents();
      setStudents(data || []);
      setIsLoading(false);
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = filterRisk === "all" || student.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
      case "critical":
        return <TrendingDown className="w-4 h-4" />;
      case "medium":
        return <Minus className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
      case "critical":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "medium":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Students</h1>
          <p className="text-gray-400">View and manage your student roster</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors"
          >
            <Mail className="w-4 h-4" />
            Message All
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
          <p className="text-sm text-gray-400">Total Students</p>
          <p className="text-2xl font-bold text-white mt-1">{students.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-sm text-emerald-400">On Track</p>
          <p className="text-2xl font-bold text-white mt-1">
            {students.filter((s) => s.riskLevel === "low").length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm text-amber-400">Needs Attention</p>
          <p className="text-2xl font-bold text-white mt-1">
            {students.filter((s) => s.riskLevel === "medium").length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">At Risk</p>
          <p className="text-2xl font-bold text-white mt-1">
            {students.filter((s) => s.riskLevel === "high" || s.riskLevel === "critical").length}
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-lumina-primary outline-none"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value as any)}
            className="px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-lumina-primary outline-none"
          >
            <option value="all" className="bg-gray-800">All Students</option>
            <option value="low" className="bg-gray-800">On Track</option>
            <option value="medium" className="bg-gray-800">Needs Attention</option>
            <option value="high" className="bg-gray-800">At Risk</option>
          </select>
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center gap-2 transition-colors border border-white/10"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Students List */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Courses</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Mastery</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-lumina-primary/20 text-lumina-primary flex items-center justify-center font-bold overflow-hidden border border-lumina-primary/30"
                        >
                          {student.avatar ? (
                            <img
                              src={student.avatar}
                              alt={student.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            student.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">{student.name}</div>
                          <div className="text-xs text-gray-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {student.courses?.slice(0, 2).map((course) => (
                          <span
                            key={course}
                            className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-gray-300"
                          >
                            {course}
                          </span>
                        ))}
                        {student.courses?.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{student.courses.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-white/10 rounded-full h-1.5">
                          <div
                            className="bg-lumina-primary h-1.5 rounded-full"
                            style={{
                              width: `${student.progress ?? student.averageProgress ?? 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {student.progress ?? student.averageProgress ?? 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "font-medium",
                          (student.averageMastery || 0) >= 80
                            ? "text-emerald-400"
                            : (student.averageMastery || 0) >= 60
                            ? "text-amber-400"
                            : "text-red-400"
                        )}
                      >
                        {student.averageMastery ?? 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                          getRiskColor(student.riskLevel || "low")
                        )}
                      >
                        {getRiskIcon(student.riskLevel || "low")}
                        {(student.riskLevel || "low")
                          .toString()
                          .replace("-", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {student.lastActive
                        ? new Date(student.lastActive).toLocaleDateString()
                        : "No activity"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/teacher/students/${student.id}`}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No students found in your courses.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
