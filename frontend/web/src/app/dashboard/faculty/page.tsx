"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  CheckSquare,
  BarChart3,
  Bot,
  AlertTriangle,
  ArrowRight,
  Plus,
  Zap,
  ShieldCheck
} from "lucide-react";
import { api } from "@/lib/api";
import { StandardDashboard } from "@/components/dashboard/StandardDashboard";
import { cn } from "@/lib/utils";

export default function FacultyDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getDashboardData("teacher"); // Using teacher as proxy for faculty data
        setDashboardData(data);
      } catch (e) {
        console.error("Failed to load faculty dashboard", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) return <LoadingState />;

  const meta = dashboardData?.meta || {};
  const stats = dashboardData?.stats || [];

  return (
    <StandardDashboard
      data={dashboardData}
      title={`Welcome, Prof. ${meta.name?.split(' ').pop() || "Educator"}`}
      subtitle="AI verification and class performance analytics terminal."
      headerAction={
        <div className="flex gap-4 mt-6">
          <Link href="/faculty/verification-queue" className="h-14 px-8 rounded-2xl bg-primary text-black font-black flex items-center gap-3 hover:scale-105 transition-all">
            Verification Queue <Zap className="w-5 h-5" />
          </Link>
          <Link href="/faculty/create-course" className="h-14 px-8 rounded-2xl border border-white/10 bg-white/5 font-bold flex items-center gap-3 hover:bg-white/10 transition-all">
            New Course <Plus className="w-5 h-5" />
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <MetricCard label="Total Students" value={getStatValue(stats, "Total Students")} icon={Users} />
        <MetricCard label="Pending Verifications" value={getStatValue(stats, "Pending Alerts") || "12"} icon={ShieldCheck} tone="warning" />
        <MetricCard label="Average Performance" value={getStatValue(stats, "Avg performance") || "84%"} icon={BarChart3} tone="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <div className="glass-v2-gold rounded-[2.5rem] p-8 border border-white/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold">Active Courses</h3>
            <Link href="/faculty/courses" className="text-primary text-xs font-black uppercase tracking-widest hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
             {/* Placeholder for real course list */}
             <CourseItem name="Data Structures & Algorithms" sections="3" risk="2 students" />
             <CourseItem name="Machine Learning Fundamentals" sections="1" risk="0 students" />
             <CourseItem name="Web Systems Architecture" sections="2" risk="5 students" />
          </div>
        </div>

        <div className="glass-v2-gold rounded-[2.5rem] p-8 border border-white/10 bg-primary/5">
          <div className="flex items-center gap-3 mb-6">
            <Bot className="w-8 h-8 text-primary" />
            <h3 className="text-2xl font-bold">Syllabus AI Agent</h3>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Upload your syllabus to automatically generate knowledge graphs, assignments, and AI tutor prompts aligned with your curriculum.
          </p>
          <button className="w-full py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all">
            Initialize Syllabus Sync <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </StandardDashboard>
  );
}

function LoadingState() {
  return <div className="min-h-screen flex items-center justify-center bg-[#090909]"><Bot className="w-12 h-12 text-primary animate-spin" /></div>;
}

function MetricCard({ label, value, icon: Icon, tone = "primary" }: any) {
  const tones = {
    primary: "text-primary bg-primary/10 border-primary/20",
    warning: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    success: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  };
  return (
    <div className="glass-v2-gold rounded-3xl p-8 border border-white/5 flex items-center gap-6">
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center border", tones[tone as keyof typeof tones])}>
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">{label}</p>
        <p className="text-4xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function CourseItem({ name, sections, risk }: any) {
  return (
    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-primary/30 transition-all cursor-pointer">
      <div>
        <h4 className="font-bold text-lg mb-1">{name}</h4>
        <p className="text-xs text-gray-500 uppercase tracking-widest">{sections} Sections • <span className="text-amber-500">{risk} at risk</span></p>
      </div>
      <ArrowRight className="w-5 h-5 text-gray-700 group-hover:text-primary transition-colors" />
    </div>
  );
}

function getStatValue(stats: any[], label: string) {
  return stats.find(s => s.label === label)?.value;
}
