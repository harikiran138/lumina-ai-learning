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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Welcome Section */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-5xl font-display font-bold mb-3 tracking-tight text-white">
            Welcome back,{" "}
            <span className="gradient-text">
              {dashboardData?.studentName || "Scholar"}
            </span>
          </h1>
          <p className="text-gray-400 text-xl font-light tracking-wide max-w-2xl">
            Where curiosity meets intelligence. Ready to resume your mastery?
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/student/course_explorer"
            className="px-6 py-3 bg-lumina-primary/10 text-lumina-primary border border-lumina-primary/20 text-sm font-bold rounded-2xl hover:bg-lumina-primary/20 transition-all duration-300 shadow-gold-glow"
          >
            Explore Catalog
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Learning Activity Chart */}
        <div className="lg:col-span-2 glass-v2 border-white/5">
          <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
              <span className="w-1.5 h-8 bg-lumina-primary rounded-full shadow-gold-glow" />
              Activity Pulse
            </h2>
            <select className="bg-surface-950 border border-white/10 rounded-xl px-4 py-1.5 text-xs text-gray-400 focus:outline-none focus:ring-1 focus:ring-lumina-primary/30 transition-all">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="p-8 h-80 w-full">
            <Line
              data={progressData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: "rgba(255, 255, 255, 0.03)" },
                    ticks: {
                      color: "rgba(255, 255, 255, 0.3)",
                      font: { size: 10 },
                    },
                  },
                  x: {
                    grid: { display: false },
                    ticks: {
                      color: "rgba(255, 255, 255, 0.3)",
                      font: { size: 10 },
                    },
                  },
                },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "rgba(10, 10, 10, 0.95)",
                    titleColor: "#FFD700",
                    bodyColor: "#fff",
                    borderColor: "rgba(255, 215, 0, 0.2)",
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 12,
                    displayColors: false,
                    titleFont: {
                      family: "var(--font-display)",
                      weight: "bold",
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Quick Actions & Status */}
        <div className="space-y-6">
          <div className="glass-v2 p-8 border-white/5">
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              Quick Actions
            </h2>
            <div className="grid gap-4">
              <Link
                href="/student/ai_tutor"
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-lumina-primary/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-lumina-primary/10 flex items-center justify-center text-lumina-primary group-hover:scale-110 transition-all duration-500 shadow-gold-glow/5 group-hover:shadow-gold-glow/20">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-white group-hover:text-lumina-primary transition-colors">
                    AI Tutor
                  </p>
                  <p className="text-xs text-gray-400 font-medium tracking-tight">
                    Personalized guidance
                  </p>
                </div>
              </Link>

              <Link
                href="/student/assessment"
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-purple-500/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-all duration-500 shadow-purple-500/5 group-hover:shadow-purple-500/20">
                  <PenTool className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-white group-hover:text-purple-400 transition-colors">
                    Assessments
                  </p>
                  <p className="text-xs text-gray-400 font-medium tracking-tight">
                    Validate your knowledge
                  </p>
                </div>
              </Link>
            </div>
          </div>

          <div className="glass-v2 p-8 border-white/5 flex flex-col justify-center">
            <h3 className="text-xl font-display font-bold mb-6 text-white flex items-center gap-3">
              <Star className="w-5 h-5 text-lumina-primary" />
              Progress
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
                        color: "rgba(255, 255, 255, 0.5)",
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 15,
                        font: {
                          size: 10,
                          weight: "bold",
                          family: "var(--font-mono)",
                        },
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
                className="glass-v2 group relative overflow-hidden flex flex-col h-full border-white/5 hover:border-lumina-primary/30 transition-all duration-500"
              >
                <div className="h-40 bg-surface-950/40 relative overflow-hidden p-8 flex flex-col justify-end border-b border-white/5">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
                    <BookOpen className="w-32 h-32 text-white transform rotate-12 translate-x-10 -translate-y-10" />
                  </div>
                  <div className="relative z-10">
                    <span className="text-[10px] font-bold text-lumina-primary uppercase tracking-[0.2em] bg-white/[0.03] backdrop-blur-md px-3 py-1 rounded-lg border border-white/5 mb-3 inline-block">
                      {course.subject || "Course"}
                    </span>
                    <h3 className="font-display font-bold text-2xl text-white line-clamp-1 group-hover:text-lumina-primary transition-colors duration-300">
                      {course.name}
                    </h3>
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <p className="text-sm text-gray-400 mb-8 line-clamp-2 flex-1 font-light leading-relaxed">
                    {course.description}
                  </p>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2.5">
                        <span className="text-gray-500">Mastery Progress</span>
                        <span className="text-lumina-primary font-mono">
                          {course.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.03] rounded-full h-1.5 overflow-hidden border border-white/5">
                        <div
                          className="bg-gradient-to-r from-lumina-primary to-amber-400 h-full rounded-full shadow-gold-glow"
                          style={{ width: `${course.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex gap-6 py-4 border-t border-white/5">
                      <div className="flex items-center gap-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                        {course.mastery || 0}% Rank
                      </div>
                      <div className="flex items-center gap-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                        {course.streak || 0} Streak
                      </div>
                    </div>

                    <Link
                      href={`/student/courses/${course.id}`}
                      className="w-full h-12 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 text-sm font-bold text-white hover:bg-lumina-primary hover:text-black hover:border-lumina-primary transition-all duration-300 group/btn"
                    >
                      Continue Mastery
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
      <div className="glass-v2 p-8 border-white/5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <Trophy className="w-6 h-6 text-lumina-primary shadow-gold-glow/20" />
            Achievements
          </h2>
          <Link
            href="/student/achievements"
            className="text-[10px] font-bold text-gray-400 hover:text-lumina-primary uppercase tracking-widest transition-colors"
          >
            View Hall of Fame
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 relative z-10">
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
                    "flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-500 overflow-hidden group/ach",
                    ach.unlocked
                      ? "bg-white/[0.04] border-lumina-primary/20 hover:border-lumina-primary/50 shadow-premium"
                      : "bg-black/20 border-white/5 opacity-40 grayscale",
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all duration-500 group-hover/ach:scale-110",
                      ach.unlocked
                        ? "bg-lumina-primary text-black shadow-gold-glow"
                        : "bg-surface-900 text-gray-500",
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-tighter line-clamp-1">
                    {ach.title}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-8 text-center bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
              <p className="text-sm text-gray-500 font-light">
                Your legacy begins here. Complete your first lesson to unlock
                achievements.
              </p>
            </div>
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
