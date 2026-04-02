"use client";

import React from "react";
import { 
  LucideIcon, 
  ArrowRight, 
  Bell, 
  TrendingUp, 
  Calendar, 
  BarChart3,
  Users,
  ShieldCheck,
  Target,
  Zap,
  BookOpen,
  GraduationCap,
  ClipboardList,
  AlertTriangle,
  FileText,
  AlertCircle,
  FileCheck
} from "lucide-react";
import { DashboardGrid } from "./DashboardGrid";
import { StatCard } from "./StatCard";
import { cn } from "@/lib/utils";

// Mapping icons from string labels from backend
const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  ShieldCheck,
  Target,
  TrendingUp,
  Zap,
  BookOpen,
  GraduationCap,
  ClipboardList,
  AlertTriangle,
  FileText,
  AlertCircle,
  FileCheck,
  BarChart3
};

interface DashboardStat {
  label: string;
  value: string;
  trend?: string;
  icon: string;
}

interface DashboardAlert {
  id: string;
  type: "warning" | "error" | "info" | "success" | "request" | "intervention";
  title: string;
  description: string;
  priority: string;
}

interface DashboardFeedItem {
  id: string;
  type: string;
  title: string;
  time: string;
  meta?: any;
}

interface StandardDashboardProps {
  data: {
    stats: DashboardStat[];
    alerts: DashboardAlert[];
    charts?: any;
    feed: DashboardFeedItem[];
    meta?: any;
  };
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children?: React.ReactNode; // For role-specific widgets
}

export function StandardDashboard({ 
  data, 
  title = "Dashboard", 
  subtitle,
  headerAction,
  children 
}: StandardDashboardProps) {
  const { stats, alerts, feed, meta } = data;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Header */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-lumina-highlight/10 via-transparent to-lumina-highlight/5 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 lg:p-12 overflow-hidden">
          <div className="flex-1 z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lumina-highlight/10 border border-lumina-highlight/20 text-lumina-highlight text-[10px] font-black uppercase tracking-[0.2em] mb-6">
               <Zap className="w-3 h-3" /> System Status: Optimized
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-white mb-2">
              {title}
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed">
              {subtitle || `Welcome back to your Lumina terminal. Everything is looking great today.`}
            </p>
            {headerAction && <div className="mt-8">{headerAction}</div>}
          </div>
          
          {meta?.role === "student" && meta?.overallMastery !== undefined && (
            <div className="shrink-0 z-10">
               {/* Large Mastery Display could go here */}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <DashboardGrid columns={4}>
        {stats.map((stat, idx) => {
          const Icon = ICON_MAP[stat.icon] || Target;
          return (
            <StatCard
              key={idx}
              title={stat.label}
              value={stat.value}
              subtitle="Current Status"
              icon={Icon}
              color="gold"
              trend={stat.trend ? { value: stat.trend, isPositive: stat.trend.startsWith("+") } : undefined}
            />
          );
        })}
      </DashboardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
        <div className="space-y-8">
          {/* Main Content / Alerts */}
          <section className="glass-v2-gold border-white/5 rounded-[2rem] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-lumina-highlight/10 flex items-center justify-center text-lumina-highlight border border-lumina-highlight/20">
                  <Bell className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-display font-bold text-white">Priority Alerts</h2>
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{alerts.length} Active</span>
            </div>
            <div className="p-6 space-y-4">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className="group relative flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
                  >
                    <div className={cn(
                      "w-2 h-2 mt-2 rounded-full ring-4 shadow-[0_0_12px_rgba(var(--color))] transition-transform group-hover:scale-125",
                      alert.priority === "critical" ? "bg-red-500 ring-red-500/10" :
                      alert.priority === "high" ? "bg-orange-500 ring-orange-500/10" :
                      "bg-lumina-highlight ring-lumina-highlight/10"
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <h3 className="font-bold text-white group-hover:text-lumina-highlight transition-colors">{alert.title}</h3>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border transition-colors",
                          alert.priority === "critical" ? "border-red-500/30 text-red-400 bg-red-400/5" :
                          alert.priority === "high" ? "border-orange-500/30 text-orange-400 bg-orange-400/5" :
                          "border-lumina-highlight/30 text-lumina-highlight bg-lumina-highlight/5"
                        )}>
                          {alert.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed font-medium">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                  <div className="w-16 h-16 rounded-3xl bg-white/[0.02] flex items-center justify-center mb-4 border border-white/5">
                    <ShieldCheck className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="font-bold uppercase tracking-widest text-[10px]">Your queue is clear</p>
                  <p className="text-sm mt-1">No pending alerts currently requiring attention.</p>
                </div>
              )}
            </div>
          </section>

          {/* Role-specific content */}
          {children}
        </div>

        <div className="space-y-8">
          {/* Feed / Activity */}
          <section className="glass-v2-gold border-white/5 rounded-[2rem] overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 border border-white/10">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-display font-bold text-white">Recent Activity</h2>
              </div>
            </div>
            <div className="flex-1 p-6 space-y-6 relative ml-4">
              <div className="absolute left-0 top-6 bottom-6 w-px bg-white/5" />
              {feed.length > 0 ? (
                feed.map((item) => (
                  <div key={item.id} className="relative pl-8 group">
                    <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-lumina-highlight border border-lumina-highlight group-hover:scale-150 transition-transform duration-300 shadow-[0_0_8px_rgba(252,196,25,0.4)]" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{item.type.replace('_', ' ')}</span>
                        <span className="text-[10px] font-medium text-gray-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {item.time}
                        </span>
                      </div>
                      <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-lumina-highlight transition-colors">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500 pl-0">
                  <p className="font-bold uppercase tracking-widest text-[10px]">Nothing to show</p>
                  <p className="text-sm mt-1">Activities will appear as they happen.</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-white/5 bg-white/[0.01]">
              <button className="w-full py-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-lumina-highlight transition-colors flex items-center justify-center gap-2">
                View Activity Log <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
