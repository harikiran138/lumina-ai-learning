"use client";

import { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  Database,
  Shield,
  Activity,
  Server,
  Settings,
  GraduationCap,
} from "lucide-react";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { StatCard } from "@/components/dashboard/StatCard";
import { api } from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    systemHealth: "98%",
    securityAlerts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await api.getDashboardData("admin");
        setStats({
          totalUsers: data.totalUsers || 0,
          totalStudents: data.totalStudents || 0,
          totalTeachers: data.totalTeachers || 0,
          totalCourses: data.totalCourses || 0,
          systemHealth: data.systemHealth || "98%",
          securityAlerts: data.securityAlerts || 0,
        });
      } catch (e) {
        console.error("Failed to fetch admin stats", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="mb-10 relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-5xl font-display font-bold mb-3 tracking-tight text-white">
            System <span className="gradient-text">Overview</span>
          </h1>
          <p className="text-gray-400 text-xl font-light tracking-wide max-w-2xl">
            Real-time monitoring and administrative control for the Lumina
            network.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/[0.03] backdrop-blur-3xl px-6 py-3 rounded-2xl border border-white/5 shadow-premium">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 blur-md opacity-60" />
          </div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-[0.2em]">
            System Operational
          </span>
        </div>
      </div>

      {/* Stats Grid using Shared Component */}
      <DashboardGrid columns={4}>
        <StatCard
          title="Total Students"
          value={stats.totalStudents || 0}
          subtitle="Enrolled learners"
          icon={Users}
          color="blue"
          trend={{ value: "+12% growth", isPositive: true }}
        />
        <StatCard
          title="Total Teachers"
          value={stats.totalTeachers || 0}
          subtitle="Active instructors"
          icon={GraduationCap}
          color="green"
        />
        <StatCard
          title="Active Courses"
          value={stats.totalCourses || 0}
          subtitle="Across all subjects"
          icon={BookOpen}
          color="gold" // Using Gold for courses
        />
        <StatCard
          title="Security Status"
          value="Secure"
          subtitle="0 Active Threats"
          icon={Shield}
          color="purple"
          trend={{ value: "Protected", isPositive: true }}
        />
      </DashboardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* System Status Panel */}
        <div className="glass-v2 border-white/5">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
              <span className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
              Infrastructure
            </h2>
            <button className="text-xs text-blue-400 hover:text-white font-bold flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-xl transition-all duration-300 border border-blue-500/20 hover:bg-blue-500/20">
              <Settings className="w-4 h-4" /> System Control
            </button>
          </div>

          <div className="p-8 space-y-4">
            <StatusItem
              name="Database Cluster"
              status="Operational"
              latency="12ms"
              icon={Database}
            />
            <StatusItem
              name="API Gateway"
              status="Operational"
              latency="45ms"
              icon={Activity}
            />
            <StatusItem
              name="AI Inference Engine"
              status="Processing"
              latency="120ms"
              icon={Server}
            />
            <StatusItem
              name="Authentication"
              status="Operational"
              latency="8ms"
              icon={Shield}
            />
          </div>
        </div>

        {/* Recent Activity Logs */}
        <div className="glass-v2 border-white/5 bg-surface-950/20">
          <div className="p-8 border-b border-white/5 flex items-center gap-3">
            <h2 className="text-2xl font-display font-bold text-white">
              Live System Logs
            </h2>
            <div className="flex-1" />
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/10" />
              <span className="w-2 h-2 rounded-full bg-white/10" />
              <span className="w-2 h-2 rounded-full bg-white/10" />
            </div>
          </div>
          <div className="p-8 pt-4 space-y-0 relative">
            <div className="absolute top-0 bottom-0 left-[2.75rem] w-px bg-white/5 z-0" />
            {/* Improved Logs Visuals */}
            <LogItem
              time="10:42 AM"
              action="User Auth"
              detail="teacher@lumina.edu"
              status="success"
            />
            <LogItem
              time="10:38 AM"
              action="Course Sync"
              detail="Intro to Machine Learning"
              status="success"
            />
            <LogItem
              time="10:15 AM"
              action="DB Snapshot"
              detail="Backup initialized #4829"
              status="info"
            />
            <LogItem
              time="09:55 AM"
              action="Security BLock"
              detail="Suspicious IP: 192.168.1.1"
              status="warning"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers
function StatusItem({ name, status, latency, icon: Icon }: any) {
  const isOperational = status === "Operational";
  const isProcessing = status === "Processing";

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group">
      <div className="flex items-center gap-4">
        <div
          className={`p-2 rounded-lg ${
            isOperational
              ? "bg-emerald-500/10 text-emerald-400"
              : isProcessing
                ? "bg-blue-500/10 text-blue-400"
                : "bg-gray-500/10 text-gray-400"
          }`}
        >
          {Icon ? <Icon size={16} /> : <div className="w-4 h-4" />}
        </div>
        <span className="text-gray-200 font-medium group-hover:text-white transition-colors">
          {name}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {latency && (
          <span className="text-xs text-gray-500 font-mono hidden sm:inline-block">
            {latency}
          </span>
        )}
        <span
          className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${
            isOperational
              ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
              : isProcessing
                ? "text-blue-400 bg-blue-500/10 border border-blue-500/20"
                : "text-amber-400 bg-amber-500/10 border border-amber-500/20"
          }`}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

function LogItem({ time, action, detail, status }: any) {
  const statusConfig: any = {
    success: {
      color: "text-emerald-400",
      bg: "bg-emerald-500",
      border: "border-emerald-500/20",
    },
    warning: {
      color: "text-red-400",
      bg: "bg-red-500",
      border: "border-red-500/20",
    },
    info: {
      color: "text-blue-400",
      bg: "bg-blue-500",
      border: "border-blue-500/20",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-start gap-4 py-4 group relative z-10">
      <span className="text-gray-600 font-mono text-xs mt-1 min-w-[4rem] group-hover:text-gray-400 transition-colors">
        {time}
      </span>
      <div
        className={`mt-1.5 w-2 h-2 rounded-full ring-4 ring-black/50 ${config.bg} shadow-[0_0_8px_rgba(0,0,0,0.5)]`}
      />
      <div className="flex-1 -mt-1 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
        <p className={`text-sm font-bold ${config.color} mb-0.5`}>{action}</p>
        <p className="text-xs text-gray-500 group-hover:text-gray-400">
          {detail}
        </p>
      </div>
    </div>
  );
}
