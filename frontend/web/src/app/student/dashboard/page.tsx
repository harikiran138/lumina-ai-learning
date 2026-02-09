"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import Link from "next/link";
import {
  Flame,
  BookOpen,
  Clock,
  Target,
  Bot,
  PenTool,
  FileText,
  Trophy,
  Star,
  Award,
  Zap,
} from "lucide-react";
import { getChartColors } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { cn } from "@/lib/utils";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

export default function StudentDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [chartColors, setChartColors] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const isDark = document.documentElement.classList.contains("dark");
        setChartColors(getChartColors(isDark));

        const data = await api.getDashboardData("student");
        setDashboardData(data);
        setIsLoading(false);
      } catch (error: any) {
        console.error("Dashboard initialization error:", error);
        setError(
          error.message || "An error occurred while loading the dashboard",
        );
        setIsLoading(false);
      }
    };

    init();

    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setChartColors(getChartColors(isDark));
    };

    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lumina-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 glass-card border-lumina-error/30">
          <h2 className="text-xl font-bold text-lumina-error mb-2">Error</h2>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-lumina-error text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Process data
  const weeklyActivity = dashboardData?.weeklyActivity || [];
  const weeks = weeklyActivity.map((w: any) => `Week ${w.week}`);
  const timeSpent = weeklyActivity.map((w: any) => w.timeSpent || 0);

  const progressData = {
    labels: weeks.length > 0 ? weeks : ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Learning Hours",
        data: timeSpent.length > 0 ? timeSpent : [0, 0, 0, 0],
        borderColor: "#FFD700", // Gold
        backgroundColor: "rgba(255, 215, 0, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#FFD700",
        pointBorderColor: "#000",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const enrolledCourses = dashboardData?.enrolledCourses || [];
  const completed = enrolledCourses.filter(
    (c: any) => (c.progress || 0) === 100,
  ).length;
  const inProgress = enrolledCourses.filter(
    (c: any) => (c.progress || 0) > 0 && (c.progress || 0) < 100,
  ).length;
  const notStarted = enrolledCourses.filter(
    (c: any) => (c.progress || 0) === 0,
  ).length;

  const courseStatusData = {
    labels: ["Not Started", "In Progress", "Completed"],
    datasets: [
      {
        data: [notStarted, inProgress, completed],
        backgroundColor: [
          "#27272a", // Surface 800 (Gray)
          "#FFD700", // Gold
          "#10B981", // Emerald
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-white">
            Welcome back,{" "}
            <span className="gradient-text">
              {dashboardData?.studentName || "Scholar"}
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Ready to continue your learning journey?
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/student/course_explorer" className="glass-button">
            Explore Courses
          </Link>
        </div>
      </div>

      {/* Stats Grid using new Component */}
      <DashboardGrid columns={4}>
        <StatCard
          title="Current Streak"
          value={dashboardData?.currentStreak || 0}
          subtitle="Days in a row"
          icon={Flame}
          color="gold"
          trend={{ value: "On Fire!", isPositive: true }}
        />
        <StatCard
          title="Active Courses"
          value={dashboardData?.enrolledCourses?.length || 0}
          subtitle="Currently enrolled"
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Total Learning"
          value={`${dashboardData?.totalHours || 0}h`}
          subtitle="Hours spent"
          icon={Clock}
          color="green"
        />
        <StatCard
          title="Average Mastery"
          value={`${dashboardData?.overallMastery || 0}%`}
          subtitle="Across all courses"
          icon={Target}
          color="purple"
        />
      </DashboardGrid>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Learning Activity Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-lumina-primary" />
              Learning Activity
            </h2>
            <select className="bg-surface-900 border border-white/10 rounded-lg px-3 py-1 text-xs text-gray-400 focus:outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <Line
              data={progressData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: "rgba(255, 255, 255, 0.05)" },
                    ticks: { color: "rgba(255, 255, 255, 0.4)" },
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: "rgba(255, 255, 255, 0.4)" },
                  },
                },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "#18181b",
                    titleColor: "#FFD700",
                    bodyColor: "#fff",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Quick Actions & Status */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4 text-white">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/student/ai_tutor"
                className="flex items-center gap-4 p-4 rounded-xl bg-surface-900/50 hover:bg-surface-900/80 hover:border-lumina-primary/30 border border-transparent transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-lumina-primary/10 flex items-center justify-center text-lumina-primary group-hover:scale-110 transition-transform">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-white">Ask AI Tutor</p>
                  <p className="text-xs text-gray-400">Get instant help</p>
                </div>
              </Link>

              <Link
                href="/student/assessment"
                className="flex items-center gap-4 p-4 rounded-xl bg-surface-900/50 hover:bg-surface-900/80 hover:border-purple-500/30 border border-transparent transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-white">Take Quiz</p>
                  <p className="text-xs text-gray-400">Test your knowledge</p>
                </div>
              </Link>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-gray-400" />
              Course Progress
            </h3>
            <div className="h-48 relative">
              <Pie
                data={courseStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "right",
                      labels: {
                        color: "rgba(255, 255, 255, 0.7)",
                        usePointStyle: true,
                        font: { size: 10 },
                      },
                    },
                  },
                  elements: {
                    arc: { borderWidth: 0 },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Courses */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Continue Learning</h2>
          <Link
            href="/student/courses"
            className="text-sm font-semibold text-lumina-primary hover:text-white transition-colors"
          >
            View All Courses →
          </Link>
        </div>

        <DashboardGrid columns={3}>
          {enrolledCourses.length > 0 ? (
            enrolledCourses.slice(0, 3).map((course: any) => (
              <div
                key={course.id}
                className="glass-card group relative overflow-hidden flex flex-col h-full"
              >
                <div className="h-32 bg-surface-900/50 relative overflow-hidden p-6 flex flex-col justify-end">
                  <div className="absolute top-0 right-0 p-4 opacity-50">
                    <BookOpen className="w-24 h-24 text-gray-800 transform rotate-12 translate-x-8 -translate-y-8" />
                  </div>
                  <div className="relative z-10">
                    <span className="text-xs font-bold text-lumina-primary uppercase tracking-wider bg-black/40 backdrop-blur-sm px-2 py-1 rounded mb-2 inline-block">
                      {course.subject || "Course"}
                    </span>
                    <h3 className="font-bold text-xl text-white line-clamp-1 group-hover:text-lumina-primary transition-colors">
                      {course.name}
                    </h3>
                  </div>
                </div>

                <div className="p-6 pt-4 flex-1 flex flex-col">
                  <p className="text-sm text-gray-400 mb-6 line-clamp-2 flex-1">
                    {course.description}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-white font-mono">
                          {course.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-surface-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-lumina-primary h-full rounded-full"
                          style={{ width: `${course.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Target className="w-4 h-4 text-purple-400" />
                        {course.mastery || 0}% Mastery
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Flame className="w-4 h-4 text-orange-400" />
                        {course.streak || 0} Day Streak
                      </div>
                    </div>

                    <Link
                      href={`/student/courses/${course.id}`}
                      className="w-full mt-4 glass-button-secondary text-center block group-hover:border-lumina-primary/50 group-hover:text-lumina-primary transition-all"
                    >
                      Continue
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-16 glass-card border-dashed">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                No Courses Started
              </h3>
              <p className="text-gray-400 mb-6">
                Explore our catalog and start learning today.
              </p>
              <Link href="/student/course_explorer" className="glass-button">
                Browse Catalog
              </Link>
            </div>
          )}
        </DashboardGrid>
      </div>

      {/* Achievements Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-lumina-primary" />
            Recent Achievements
          </h2>
          <Link
            href="/student/achievements"
            className="text-xs text-gray-400 hover:text-white"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {dashboardData?.achievements?.length > 0 ? (
            dashboardData.achievements.map((ach: any, i: number) => {
              const Icon =
                ach.icon === "Star"
                  ? Star
                  : ach.icon === "Flame"
                    ? Flame
                    : Trophy;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center",
                    ach.unlocked
                      ? "bg-lumina-primary/5 border-lumina-primary/20"
                      : "bg-surface-900/50 border-transparent opacity-50 grayscale",
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center mb-3 shadow-lg",
                      ach.unlocked
                        ? "bg-lumina-primary text-black"
                        : "bg-gray-800 text-gray-500",
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white line-clamp-1">
                    {ach.title}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="col-span-full text-center text-gray-500 text-sm py-4">
              No achievements unlocked yet. Keep learning!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PieChartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
