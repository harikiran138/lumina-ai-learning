"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Target,
  MessageSquare,
  FileText,
  BarChart3,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface StudentDetail {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedAt: string;
  courses: Array<{
    id: string;
    name: string;
    progress: number;
    mastery: number;
    lastAccessed: string;
  }>;
  stats: {
    overallProgress: number;
    overallMastery: number;
    assignmentsCompleted: number;
    assignmentsTotal: number;
    averageScore: number;
    streak: number;
    totalTime: number;
  };
  recentActivity: Array<{
    id: string;
    type: "lesson" | "assignment" | "quiz";
    title: string;
    course: string;
    timestamp: string;
    score?: number;
  }>;
  weakTopics: string[];
  strongTopics: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  lastActive: string;
}

const EMPTY_STUDENT: StudentDetail = {
  id: "",
  name: "",
  email: "",
  avatar: "",
  joinedAt: "",
  courses: [],
  stats: {
    overallProgress: 0,
    overallMastery: 0,
    assignmentsCompleted: 0,
    assignmentsTotal: 0,
    averageScore: 0,
    streak: 0,
    totalTime: 0,
  },
  recentActivity: [],
  weakTopics: [],
  strongTopics: [],
  riskLevel: "low",
  lastActive: "",
};

function ProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  color = "amber",
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: "amber" | "emerald" | "blue" | "red";
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const colors = {
    amber: "text-amber-400",
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    red: "text-red-400",
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-1000", colors[color])}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("text-2xl font-bold", colors[color])}>{value}%</span>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const [student, setStudent] = useState<StudentDetail>(EMPTY_STUDENT);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "topics">("overview");

  useEffect(() => {
    if (studentId) {
      loadStudentData();
    }
  }, [studentId]);

  const loadStudentData = async () => {
    setIsLoading(true);
    try {
      // Fetch student profile and progress data
      const [profileData, progressData] = await Promise.all([
        api.getPersonalizationProfile(studentId),
        api.getStudentProgress(),
      ]);

      // Transform the data
      const studentData: StudentDetail = {
        id: studentId,
        name: profileData?.name || "Student",
        email: profileData?.email || "",
        avatar:
          profileData?.avatar ||
          `https://ui-avatars.com/api/?name=${profileData?.name || "S"}&background=random`,
        joinedAt: profileData?.created_at || new Date().toISOString(),
        courses: progressData?.recentCourses?.map((c: any) => ({
          id: c.id,
          name: c.courseName,
          progress: c.progress,
          mastery: c.mastery,
          lastAccessed: new Date().toISOString(),
        })) || [],
        stats: {
          overallProgress: Math.round(progressData?.overallMastery || 0),
          overallMastery: Math.round(profileData?.overall_mastery * 100 || 0),
          assignmentsCompleted: progressData?.stats?.assignmentsCompleted || 0,
          assignmentsTotal: 10,
          averageScore: Math.round(profileData?.overall_mastery * 100 || 0),
          streak: progressData?.stats?.currentStreak || 0,
          totalTime: 24,
        },
        recentActivity: [
          {
            id: "1",
            type: "lesson",
            title: "Completed Introduction to Calculus",
            course: "Mathematics 101",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: "2",
            type: "assignment",
            title: "Submitted Assignment: Derivatives",
            course: "Mathematics 101",
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            score: 85,
          },
        ],
        weakTopics: profileData?.weak_topics || [],
        strongTopics: profileData?.strong_topics || [],
        riskLevel: profileData?.risk_summary?.risk_level || "low",
        lastActive: profileData?.last_active || new Date().toISOString(),
      };

      setStudent(studentData);
    } catch (error) {
      console.error("Failed to load student data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500" />
      </div>
    );
  }

  const riskColors = {
    low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    high: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    critical: "text-red-400 bg-red-400/10 border-red-400/20",
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/teacher/students"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Students
        </Link>
      </div>

      {/* Student Profile Header */}
      <div className="glass-v2 border-white/5 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <img
            src={student.avatar}
            alt={student.name}
            className="w-24 h-24 rounded-2xl border-2 border-amber-500/30 object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{student.name}</h1>
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium border",
                  riskColors[student.riskLevel]
                )}
              >
                {student.riskLevel.charAt(0).toUpperCase() + student.riskLevel.slice(1)} Risk
              </span>
            </div>
            <p className="text-gray-400">{student.email}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {new Date(student.joinedAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Last active {new Date(student.lastActive).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors">
              <Mail className="w-4 h-4" />
              Message
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10">
              <BarChart3 className="w-4 h-4" />
              Full Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile
          icon={Target}
          label="Overall Progress"
          value={`${student.stats.overallProgress}%`}
          subtext="Course completion"
        />
        <StatTile
          icon={Award}
          label="Mastery Score"
          value={`${student.stats.overallMastery}%`}
          subtext="Average across topics"
        />
        <StatTile
          icon={FileText}
          label="Assignments"
          value={`${student.stats.assignmentsCompleted}/${student.stats.assignmentsTotal}`}
          subtext={`${student.stats.averageScore}% avg score`}
        />
        <StatTile
          icon={TrendingUp}
          label="Current Streak"
          value={`${student.stats.streak} days`}
          subtext="Keep it up!"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Progress Rings */}
        <div className="glass-v2 border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Performance Overview</h2>
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <ProgressRing
                value={student.stats.overallMastery}
                color={student.stats.overallMastery >= 70 ? "emerald" : "amber"}
              />
              <p className="mt-4 text-sm text-gray-400">Overall Mastery</p>
            </div>
            <div className="w-full space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Course Progress</span>
                  <span className="text-white">{student.stats.overallProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${student.stats.overallProgress}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Assignment Completion</span>
                  <span className="text-white">
                    {Math.round(
                      (student.stats.assignmentsCompleted / student.stats.assignmentsTotal) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-emerald-400 transition-all duration-500"
                    style={{
                      width: `${(student.stats.assignmentsCompleted / student.stats.assignmentsTotal) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Courses & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-white/10">
            {(["overview", "activity", "topics"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors border-b-2",
                  activeTab === tab
                    ? "text-amber-400 border-amber-400"
                    : "text-gray-400 border-transparent hover:text-white"
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Enrolled Courses</h3>
              {student.courses.length > 0 ? (
                student.courses.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{course.name}</p>
                          <p className="text-xs text-gray-400">
                            Last accessed: {new Date(course.lastAccessed).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{course.mastery}%</p>
                        <p className="text-xs text-gray-400">mastery</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-white">{course.progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10">
                          <div
                            className="h-1.5 rounded-full bg-amber-400"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No courses enrolled
                </div>
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              {student.recentActivity.length > 0 ? (
                student.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        activity.type === "lesson"
                          ? "bg-blue-500/10 text-blue-400"
                          : activity.type === "assignment"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      )}
                    >
                      {activity.type === "lesson" && <BookOpen className="w-5 h-5" />}
                      {activity.type === "assignment" && <FileText className="w-5 h-5" />}
                      {activity.type === "quiz" && <Target className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{activity.title}</p>
                      <p className="text-sm text-gray-400">{activity.course}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {activity.score && (
                      <div className="text-right">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-sm font-medium",
                            activity.score >= 80
                              ? "bg-emerald-500/20 text-emerald-400"
                              : activity.score >= 60
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                          )}
                        >
                          {activity.score}%
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">No recent activity</div>
              )}
            </div>
          )}

          {activeTab === "topics" && (
            <div className="space-y-6">
              {/* Weak Topics */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Areas for Improvement
                </h3>
                {student.weakTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {student.weakTopics.map((topic) => (
                      <span
                        key={topic}
                        className="px-3 py-1.5 rounded-full text-sm bg-red-500/10 text-red-400 border border-red-500/20"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span>No weak areas identified</span>
                  </div>
                )}
              </div>

              {/* Strong Topics */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  Strong Areas
                </h3>
                {student.strongTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {student.strongTopics.map((topic) => (
                      <span
                        key={topic}
                        className="px-3 py-1.5 rounded-full text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No strong areas identified yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
