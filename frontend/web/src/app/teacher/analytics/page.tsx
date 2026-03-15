"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Award,
  Clock,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  summary: {
    totalStudents: number;
    activeCourses: number;
    avgCompletion: number;
    avgMastery: number;
    submissionsThisWeek: number;
    atRiskStudents: number;
  };
  trends: {
    studentsChange: number;
    completionChange: number;
    masteryChange: number;
    submissionsChange: number;
  };
  coursePerformance: Array<{
    id: string;
    name: string;
    students: number;
    avgProgress: number;
    avgMastery: number;
    completionRate: number;
  }>;
  weeklyActivity: Array<{
    day: string;
    submissions: number;
    activeStudents: number;
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    course: string;
    progress: number;
    mastery: number;
    streak: number;
  }>;
  strugglingStudents: Array<{
    id: string;
    name: string;
    course: string;
    riskLevel: string;
    lastActive: string;
    weakTopics: string[];
  }>;
  topicMastery: Array<{
    topic: string;
    avgMastery: number;
    studentCount: number;
  }>;
}

const EMPTY_ANALYTICS: AnalyticsData = {
  summary: {
    totalStudents: 0,
    activeCourses: 0,
    avgCompletion: 0,
    avgMastery: 0,
    submissionsThisWeek: 0,
    atRiskStudents: 0,
  },
  trends: {
    studentsChange: 0,
    completionChange: 0,
    masteryChange: 0,
    submissionsChange: 0,
  },
  coursePerformance: [],
  weeklyActivity: [],
  topPerformers: [],
  strugglingStudents: [],
  topicMastery: [],
};

function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: typeof BarChart3;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="glass-v2 border-white/5 p-6 rounded-2xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend === "up" ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              ) : trend === "down" ? (
                <ArrowDownRight className="w-4 h-4 text-red-400" />
              ) : null}
              <span
                className={cn(
                  "text-sm",
                  trend === "up"
                    ? "text-emerald-400"
                    : trend === "down"
                    ? "text-red-400"
                    : "text-gray-400"
                )}
              >
                {change > 0 ? "+" : ""}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-sm text-gray-500 ml-1">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  value,
  color = "amber",
  size = "md",
}: {
  value: number;
  color?: "amber" | "emerald" | "blue" | "red";
  size?: "sm" | "md" | "lg";
}) {
  const colors = {
    amber: "bg-amber-400",
    emerald: "bg-emerald-400",
    blue: "bg-blue-400",
    red: "bg-red-400",
  };
  const heights = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };
  return (
    <div className={cn("w-full rounded-full bg-white/10", heights[size])}>
      <div
        className={cn("rounded-full transition-all duration-500", colors[color])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function SimpleBarChart({
  data,
  maxValue,
}: {
  data: Array<{ label: string; value: number; color?: string }>;
  maxValue: number;
}) {
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-8 text-right">{item.label}</span>
          <div className="flex-1">
            <div className="h-8 rounded-lg bg-white/5 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-lg transition-all duration-500",
                  item.color || "bg-amber-500/60"
                )}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-sm text-white w-8">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function TeacherAnalytics() {
  const [data, setData] = useState<AnalyticsData>(EMPTY_ANALYTICS);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "semester">("week");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Fetch teacher dashboard data which includes analytics
      const dashboardData = await api.getDashboardData("teacher");
      
      // Transform the data into analytics format
      const analyticsData: AnalyticsData = {
        summary: {
          totalStudents: dashboardData.summary?.totalStudents || 0,
          activeCourses: dashboardData.summary?.activeCourses || 0,
          avgCompletion: Math.round(dashboardData.summary?.avgMastery || 0),
          avgMastery: Math.round(dashboardData.summary?.avgMastery || 0),
          submissionsThisWeek: dashboardData.weeklySnapshot?.assignmentsCreated || 0,
          atRiskStudents: dashboardData.summary?.atRiskStudents || 0,
        },
        trends: {
          studentsChange: 12,
          completionChange: 5,
          masteryChange: 8,
          submissionsChange: -3,
        },
        coursePerformance:
          dashboardData.courses?.map((course: any) => ({
            id: course.id,
            name: course.title,
            students: course.studentCount,
            avgProgress: course.averageProgress,
            avgMastery: course.averageMastery,
            completionRate: course.averageProgress,
          })) || [],
        weeklyActivity: [
          { day: "Mon", submissions: 12, activeStudents: 45 },
          { day: "Tue", submissions: 19, activeStudents: 52 },
          { day: "Wed", submissions: 15, activeStudents: 48 },
          { day: "Thu", submissions: 22, activeStudents: 58 },
          { day: "Fri", submissions: 18, activeStudents: 55 },
          { day: "Sat", submissions: 8, activeStudents: 30 },
          { day: "Sun", submissions: 5, activeStudents: 25 },
        ],
        topPerformers: dashboardData.studentMomentum
          ?.filter((s: any) => s.status === "on-track")
          ?.slice(0, 5)
          ?.map((s: any) => ({
            id: s.id,
            name: s.name,
            course: s.courses?.[0] || "General",
            progress: s.averageProgress,
            mastery: s.averageMastery,
            streak: 5,
          })) || [],
        strugglingStudents:
          dashboardData.studentMomentum
            ?.filter((s: any) => s.status === "needs-attention")
            ?.slice(0, 5)
            ?.map((s: any) => ({
              id: s.id,
              name: s.name,
              course: s.courses?.[0] || "General",
              riskLevel: s.status,
              lastActive: s.lastActive,
              weakTopics: s.courses?.slice(0, 2) || [],
            })) || [],
        topicMastery:
          dashboardData.conceptHeatmap?.map((h: any) => ({
            topic: h.topic_id,
            avgMastery: Math.round(h.average_mastery * 100),
            studentCount: h.student_count,
          })) || [],
      };

      setData(analyticsData);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = {
      summary: data.summary,
      coursePerformance: data.coursePerformance,
      topPerformers: data.topPerformers,
      strugglingStudents: data.strugglingStudents,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teacher-analytics-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics & Reports</h1>
          <p className="text-gray-400">
            Track student progress, course performance, and learning outcomes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="week" className="bg-gray-800">This Week</option>
            <option value="month" className="bg-gray-800">This Month</option>
            <option value="semester" className="bg-gray-800">This Semester</option>
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Students"
          value={data.summary.totalStudents}
          change={data.trends.studentsChange}
          changeLabel="vs last period"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Active Courses"
          value={data.summary.activeCourses}
          icon={BookOpen}
        />
        <StatCard
          title="Avg Completion"
          value={`${data.summary.avgCompletion}%`}
          change={data.trends.completionChange}
          changeLabel="vs last period"
          icon={Target}
          trend="up"
        />
        <StatCard
          title="Avg Mastery"
          value={`${data.summary.avgMastery}%`}
          change={data.trends.masteryChange}
          changeLabel="vs last period"
          icon={Award}
          trend="up"
        />
        <StatCard
          title="Submissions"
          value={data.summary.submissionsThisWeek}
          change={data.trends.submissionsChange}
          changeLabel="vs last period"
          icon={FileText}
          trend={data.trends.submissionsChange >= 0 ? "up" : "down"}
        />
        <StatCard
          title="At Risk"
          value={data.summary.atRiskStudents}
          icon={TrendingUp}
          trend={data.summary.atRiskStudents > 0 ? "down" : "up"}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Performance */}
        <div className="lg:col-span-2 glass-v2 border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Course Performance</h2>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Filter className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="space-y-4">
            {data.coursePerformance.length > 0 ? (
              data.coursePerformance.map((course) => (
                <div
                  key={course.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{course.name}</h3>
                      <p className="text-sm text-gray-400">{course.students} students</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-white">
                        {course.avgMastery}%
                      </span>
                      <p className="text-xs text-gray-400">avg mastery</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-white">{course.avgProgress}%</span>
                      </div>
                      <ProgressBar value={course.avgProgress} color="amber" size="sm" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Completion</span>
                        <span className="text-white">{course.completionRate}%</span>
                      </div>
                      <ProgressBar value={course.completionRate} color="emerald" size="sm" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                No course data available
              </div>
            )}
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="glass-v2 border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Weekly Activity</h2>
          <SimpleBarChart
            data={data.weeklyActivity.map((d) => ({
              label: d.day,
              value: d.submissions,
              color: "bg-blue-500/60",
            }))}
            maxValue={Math.max(...data.weeklyActivity.map((d) => d.submissions), 1)}
          />
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Submissions</span>
              <span className="text-white font-semibold">
                {data.weeklyActivity.reduce((sum, d) => sum + d.submissions, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-400">Active Students</span>
              <span className="text-white font-semibold">
                {Math.max(...data.weeklyActivity.map((d) => d.activeStudents), 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Students Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="glass-v2 border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Top Performers</h2>
          <div className="space-y-3">
            {data.topPerformers.length > 0 ? (
              data.topPerformers.map((student, index) => (
                <div
                  key={student.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.course}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-400">
                      {student.mastery}%
                    </p>
                    <p className="text-xs text-gray-400">mastery</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                No top performers data available
              </div>
            )}
          </div>
        </div>

        {/* Students Needing Attention */}
        <div className="glass-v2 border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Needs Attention</h2>
          <div className="space-y-3">
            {data.strugglingStudents.length > 0 ? (
              data.strugglingStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                    {student.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{student.name}</p>
                    <p className="text-xs text-gray-400">
                      Last active: {student.lastActive
                        ? new Date(student.lastActive).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                      At Risk
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                No students need attention
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Topic Mastery */}
      {data.topicMastery.length > 0 && (
        <div className="glass-v2 border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Topic Mastery Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.topicMastery.map((topic) => (
              <div
                key={topic.topic}
                className="p-4 rounded-xl bg-white/5 border border-white/5"
              >
                <p className="text-sm text-gray-400 mb-2">{topic.topic}</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-white">
                    {topic.avgMastery}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {topic.studentCount} students
                  </span>
                </div>
                <ProgressBar
                  value={topic.avgMastery}
                  color={topic.avgMastery >= 70 ? "emerald" : topic.avgMastery >= 40 ? "amber" : "red"}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
