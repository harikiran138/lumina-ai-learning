"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Clock,
  Calendar,
  ChevronDown,
  BarChart3,
  PieChart as PieChartIcon,
  FileText,
  Filter
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ClassReportsPage() {
  const [reportType, setReportType] = useState("Academic Mastery");
  const [timeRange, setTimeRange] = useState("Last 30 Days");

  // Mock data for visualizations
  const lineData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Class Average Mastery (%)",
        data: [65, 68, 72, 70, 78, 84],
        borderColor: "#fbbf24",
        backgroundColor: "rgba(251, 191, 36, 0.1)",
        tension: 0.4,
        fill: true,
      }
    ],
  };

  const barData = {
    labels: ["Module 1", "Module 2", "Module 3", "Module 4", "Module 5"],
    datasets: [
      {
        label: "Completion Rate (%)",
        data: [100, 95, 88, 72, 45],
        backgroundColor: "rgba(251, 191, 36, 0.6)",
        borderRadius: 8,
      }
    ],
  };

  const pieData = {
    labels: ["Advanced", "Proficient", "Developing", "At Risk"],
    datasets: [
      {
        data: [30, 45, 15, 10],
        backgroundColor: [
          "rgba(251, 191, 36, 0.8)",
          "rgba(251, 191, 36, 0.6)",
          "rgba(251, 191, 36, 0.4)",
          "rgba(248, 113, 113, 0.6)",
        ],
        borderWidth: 0,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.8)",
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "rgba(255,255,255,0.4)" }
      },
      x: {
        grid: { display: false },
        ticks: { color: "rgba(255,255,255,0.4)" }
      }
    }
  };

  return (
    <div className="min-h-screen space-y-8 p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link 
            href="/teacher/analytics"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Analytics
          </Link>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Class Reports
          </h1>
          <p className="mt-2 text-gray-400 max-w-2xl">
            Detailed performance exports and visual analytics. Track growth trajectories and completion velocities across your cohorts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-all">
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-4 items-center glass-v2 p-4 rounded-2xl border-white/5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white">
          <FileText className="h-4 w-4 text-amber-400" />
          <span className="font-semibold">{reportType}</span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white">
          <Calendar className="h-4 w-4 text-amber-400" />
          <span className="font-semibold">{timeRange}</span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </div>
        <div className="h-6 w-px bg-white/10 mx-2" />
        <button className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">
          <Filter className="h-3 w-3" />
          More Filters
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Completion Rate", value: "82.4%", trend: "+5.2%", icon: BookOpen, color: "text-amber-400" },
          { label: "Avg Mastery", value: "78%", trend: "+3.1%", icon: TrendingUp, color: "text-amber-400" },
          { label: "Active Learners", value: "48/52", trend: "Stable", icon: Users, color: "text-yellow-400" },
          { label: "Avg Time", value: "42m", trend: "-12%", icon: Clock, color: "text-yellow-400" }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-v2 border-white/5 p-6 rounded-3xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{stat.label}</p>
                <h3 className="text-3xl font-display font-bold text-white">{stat.value}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl bg-white/5", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className={cn(
              "mt-4 text-xs font-bold",
              stat.trend.startsWith('+') ? "text-yellow-400" : stat.trend === "Stable" ? "text-gray-400" : "text-amber-400"
            )}>
              {stat.trend} <span className="text-gray-600 font-normal ml-1">vs prev. period</span>
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="glass-v2 border-white/5 p-8 rounded-3xl flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-white">Mastery Progression</h3>
              <p className="text-sm text-gray-500">Aggregate class performance over the selected timeframe.</p>
            </div>
            <BarChart3 className="h-5 w-5 text-gray-500" />
          </div>
          <div className="flex-1 min-h-[300px] relative">
            <Line data={lineData} options={chartOptions as any} />
          </div>
        </section>

        <section className="glass-v2 border-white/5 p-8 rounded-3xl flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-white">Grade Distribution</h3>
              <p className="text-sm text-gray-500">Current cohort segmentation.</p>
            </div>
            <PieChartIcon className="h-5 w-5 text-gray-500" />
          </div>
          <div className="flex-1 min-h-[300px] relative">
            <Pie data={pieData} options={{ ...chartOptions, scales: { x: { display: false }, y: { display: false } } } as any} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {pieData.labels.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: pieData.datasets[0].backgroundColor[i] }} />
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="glass-v2 border-white/5 p-8 rounded-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-white">Module Completion Velocity</h3>
            <p className="text-sm text-gray-500">Tracking friction points across course content.</p>
          </div>
          <button className="text-sm font-bold text-amber-400 hover:text-white transition-colors">
            View Content Insights
          </button>
        </div>
        <div className="h-64 relative">
          <Bar data={barData} options={chartOptions as any} />
        </div>
      </section>

      <div className="glass-v2 border-amber-400/10 bg-amber-400/[0.02] p-8 rounded-3xl flex items-center justify-between gap-8">
        <div className="flex-1">
          <h4 className="text-lg font-bold text-white mb-2">Ready for a Strategic Review?</h4>
          <p className="text-sm text-gray-400 max-w-xl">
            Lumina AI has identified that students in the 'Developing' segment are struggling primarily with Module 4. We recommend generating a targeted revision assignment before the mid-term.
          </p>
        </div>
        <button className="shrink-0 rounded-2xl bg-white text-black px-6 py-3 font-bold hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]">
          Draft Revision Pack
        </button>
      </div>
    </div>
  );
}
