import { Metadata } from "next";
import {
  Users,
  BookOpen,
  Database,
  Shield,
  Activity,
  Server,
  AlertTriangle,
  CheckCircle,
  GraduationCap,
  Clock,
  Settings,
} from "lucide-react";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { StatCard } from "@/components/dashboard/StatCard";

export const metadata: Metadata = {
  title: "Admin Dashboard | Lumina",
  description: "System administration and overview",
};

async function getAdminStats() {
  try {
    // Use Server Action
    const { getAdminDashboard } = await import("@/app/actions/data");
    const stats = await getAdminDashboard("admin@lumina.com");

    return (
      stats || {
        totalUsers: 0,
        totalStudents: 0,
        totalTeachers: 0,
        totalCourses: 0,
        systemHealth: "98%",
        securityAlerts: 0,
      }
    );
  } catch (e) {
    console.error("Failed to fetch admin stats", e);
    return {
      totalUsers: 0,
      totalStudents: 0,
      totalTeachers: 0,
      totalCourses: 0,
      systemHealth: "0%",
      securityAlerts: 0,
    };
  }
}

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mb-8 relative z-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-white">
            System <span className="gradient-text-blue">Overview</span>
          </h1>
          <p className="text-gray-400">
            Monitor system performance and user activity.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold text-green-400 uppercase tracking-wider">
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
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-gray-400" />
              Infrastructure Status
            </h2>
            <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <Settings className="w-3 h-3" /> Manage
            </button>
          </div>

          <div className="space-y-4">
            <StatusItem
              name="Database Cluster"
              status="Operational"
              latency="12ms"
            />
            <StatusItem
              name="API Gateway"
              status="Operational"
              latency="45ms"
            />
            <StatusItem
              name="AI Inference Engine"
              status="Processing"
              latency="120ms"
            />
            <StatusItem
              name="Authentication"
              status="Operational"
              latency="8ms"
            />
            <StatusItem name="Backup Systems" status="Idle" />
          </div>
        </div>

        {/* Recent Activity Logs */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" />
            Recent System Logs
          </h2>
          <div className="space-y-0">
            {/* Improved Logs Visuals */}
            <LogItem
              time="10:42 AM"
              action="User Login"
              detail="teacher@lumina.edu"
              status="success"
            />
            <LogItem
              time="10:38 AM"
              action="Course Created"
              detail="Intro to Machine Learning"
              status="success"
            />
            <LogItem
              time="10:15 AM"
              action="System Backup"
              detail="Snapshot #4829 created"
              status="info"
            />
            <LogItem
              time="09:55 AM"
              action="Failed Auth Attempt"
              detail="IP: 192.168.1.1 (Blocked)"
              status="warning"
            />
            <LogItem
              time="09:30 AM"
              action="Service Restart"
              detail="Notification Service"
              status="info"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers
function StatusItem({ name, status, latency }: any) {
  const isOperational = status === "Operational";
  const isProcessing = status === "Processing";

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-surface-900/40 hover:bg-surface-900/60 transition-colors border border-white/5">
      <div className="flex items-center gap-3">
        <div
          className={`w-2 h-2 rounded-full ${
            isOperational
              ? "bg-emerald-500"
              : isProcessing
                ? "bg-blue-500 animate-pulse"
                : "bg-yellow-500"
          }`}
        />
        <span className="text-gray-200 font-medium">{name}</span>
      </div>
      <div className="flex items-center gap-4">
        {latency && (
          <span className="text-xs text-gray-600 font-mono">{latency}</span>
        )}
        <span
          className={`text-xs px-2 py-1 rounded-md font-medium ${
            isOperational
              ? "text-emerald-400 bg-emerald-500/10"
              : isProcessing
                ? "text-blue-400 bg-blue-500/10"
                : "text-yellow-400 bg-yellow-500/10"
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
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    warning: {
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
    info: {
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors group">
      <span className="text-gray-600 font-mono text-xs w-16 group-hover:text-gray-400 transition-colors">
        {time}
      </span>
      <div className="flex-1">
        <p className="text-gray-200 text-sm font-medium">{action}</p>
        <p className="text-xs text-gray-500">{detail}</p>
      </div>
      <div className={`w-2 h-2 rounded-full ${config.bg.replace("/10", "")}`} />
    </div>
  );
}
