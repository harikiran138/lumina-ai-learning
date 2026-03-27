"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  BarChart2,
  FileText,
  Upload,
  PlusCircle,
  Bell,
  ArrowDownRight,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    avgMastery: 0,
    pendingGrading: 0,
  });
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.getDashboardData("teacher");
        setStats({
          totalStudents: data.totalStudents || 0,
          activeCourses: data.activeCourses || 0,
          avgMastery: data.avgMastery || 0,
          pendingGrading: data.pendingGrading || 5,
        });

        // Use a public way to get API base or just hardcode if needed
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const assignmentsRes = await fetch(`${apiBase}/api/assignments/list`);
        if (assignmentsRes.ok) {
          setAssignments(await assignmentsRes.json());
        }
      } catch (e) {
        console.error("Failed to fetch teacher data", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="relative z-10">
        <h1 className="text-5xl font-display font-bold mb-3 tracking-tight text-white">
          Welcome back, <span className="gradient-text">Teacher</span>!
        </h1>
        <p className="text-gray-400 text-xl font-light tracking-wide max-w-2xl">
          Your command center for academic excellence and student growth.
        </p>
      </div>

      {/* Stats Grid */}
      <DashboardGrid columns={4}>
        <StatCard
          icon={Users}
          color="gold"
          title="Total Students"
          value={stats.totalStudents}
          subtitle="Active learners"
          trend={{ value: "+12% this month", isPositive: true }}
        />
        <StatCard
          icon={BookOpen}
          color="gold"
          title="Active Courses"
          value={stats.activeCourses}
          subtitle="Courses managed"
        />
        <StatCard
          icon={BarChart2}
          color="gold"
          title="Avg Mastery"
          value={`${stats.avgMastery}%`}
          subtitle="Class performance"
          trend={{ value: "+2.4% this week", isPositive: true }}
        />
        <StatCard
          icon={FileText}
          color="gold"
          title="To Grade"
          value={stats.pendingGrading}
          subtitle="Pending assessments"
        />
      </DashboardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Course List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-v2 overflow-hidden border-white/5">
            <div className="p-8 border-b border-white/5 flex justify-between items-center group/header">
              <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                <span className="w-1.5 h-8 bg-lumina-primary rounded-full shadow-gold-glow" />
                Your Courses
              </h2>
              <Link
                href="/teacher/courses"
                className="text-sm text-lumina-primary hover:text-white font-bold transition-all duration-300 flex items-center gap-1 group-hover/header:translate-x-1"
              >
                View Catalog
                <ArrowDownRight className="w-4 h-4 rotate-[-135deg]" />
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              <CourseItem
                name="Advanced Artificial Intelligence"
                level="Graduate"
                students={42}
                status="Active"
                image="https://placehold.co/600x400/0a0a0a/FFF?text=AI"
              />
              <CourseItem
                name="Introduction to Machine Learning"
                level="Undergraduate"
                students={128}
                status="Active"
                image="https://placehold.co/600x400/0a0a0a/FFF?text=ML"
              />
              <CourseItem
                name="Neural Networks Deep Dive"
                level="Advanced"
                students={15}
                status="Draft"
                image="https://placehold.co/600x400/0a0a0a/FFF?text=NN"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="glass-v2 p-8 border-white/5">
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              Quick Actions
            </h2>
            <div className="grid gap-4">
              <QuickActionButton
                icon={Upload}
                color="gold"
                title="Upload Content"
                subtitle="Add new materials"
              />
              <QuickActionButton
                icon={PlusCircle}
                color="gold"
                title="Create Assessment"
                subtitle="New quiz or exam"
              />
              <QuickActionButton
                icon={Bell}
                color="gold"
                title="Announcement"
                subtitle="Notify students"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Recent Assignments Section */}
      <div className="relative z-10">
        <div className="glass-v2 overflow-hidden border-white/5">
          <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-2xl font-display font-bold text-white">
              Recent Assignments
            </h2>
            <Link
              href="/teacher/assignments/create"
              className="px-5 py-2.5 bg-lumina-primary/10 text-lumina-primary border border-lumina-primary/20 text-sm font-bold rounded-xl hover:bg-lumina-primary/20 transition-all duration-300 flex items-center gap-2 shadow-gold-glow"
            >
              <PlusCircle size={18} />
              New Assignment
            </Link>
          </div>
          <div className="p-8">
            <AssignmentsList assignments={assignments} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignmentsList({ assignments }: { assignments: any[] }) {
  if (assignments.length === 0) {
    return (
      <p className="text-gray-400 text-center py-4">
        No assignments created yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-gray-400 border-b border-white/10">
            <th className="pb-3 text-sm font-medium pl-2">Title</th>
            <th className="pb-3 text-sm font-medium">Course</th>
            <th className="pb-3 text-sm font-medium">Due Date</th>
            <th className="pb-3 text-sm font-medium">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {assignments.map((asm: any) => (
            <tr
              key={asm.id}
              className="group hover:bg-white/5 transition-colors"
            >
              <td className="py-4 text-white font-medium pl-2">{asm.title}</td>
              <td className="py-4 text-gray-400">{asm.course_id}</td>
              <td className="py-4 text-gray-400">
                {new Date(asm.due_date).toLocaleDateString()}
                <span className="ml-2 text-xs text-gray-500">
                  {new Date(asm.due_date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </td>
              <td className="py-4 text-gray-500 text-sm max-w-md truncate">
                {asm.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CourseItem({ name, level, students, status, image }: any) {
  return (
    <div className="p-8 hover:bg-white/[0.03] transition-all duration-500 group cursor-pointer relative overflow-hidden">
      {/* Hover Indicator */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-lumina-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 shadow-gold-glow" />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex gap-6">
          <div className="w-20 h-20 rounded-2xl bg-surface-950 overflow-hidden relative shadow-premium group-hover:shadow-gold transition-all duration-500 border border-white/10 group-hover:border-lumina-primary/30">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 blur-[0.5px] group-hover:blur-0"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="text-lg font-display font-bold text-white mb-1.5 group-hover:text-lumina-primary transition-colors duration-300">
              {name}
            </h3>
            <p className="text-sm text-gray-400 font-medium mb-3 flex items-center gap-2">
              <span className="text-lumina-primary opacity-60">•</span> {level}
              <span className="text-white/10 mx-1">|</span> {students} Students
              Enrolled
            </p>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-lg border transition-all duration-300",
                  status === "Active"
                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 group-hover:bg-yellow-500/20"
                    : "bg-surface-950 text-gray-500 border-white/10",
                )}
              >
                {status}
              </span>
              <span className="text-gray-600 text-[10px] font-medium tracking-tight">
                System Managed • Sync Active
              </span>
            </div>
          </div>
        </div>
        <button
          className="p-3 text-gray-500 hover:text-lumina-primary hover:bg-lumina-primary/10 rounded-xl transition-all duration-300 group-hover:rotate-45"
          suppressHydrationWarning
        >
          <ArrowDownRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

function QuickActionButton({ icon: Icon, color, title, subtitle }: any) {
  const colorClasses: any = {
    blue: "text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5",
    gold: "text-lumina-primary bg-lumina-primary/10 border-lumina-primary/20 shadow-gold-glow/5",
    purple:
      "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 shadow-yellow-500/5",
  };
  return (
    <button
      className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/[0.04] transition-all duration-300 text-left border border-white/5 hover:border-white/10 group relative overflow-hidden"
      suppressHydrationWarning
    >
      <div
        className={cn(
          "p-3 rounded-xl border transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg",
          colorClasses[color],
        )}
      >
        <Icon size={22} />
      </div>
      <div className="relative z-10">
        <p className="font-bold text-white group-hover:text-lumina-primary transition-colors duration-300">
          {title}
        </p>
        <p className="text-xs text-gray-400/80 font-medium tracking-tight">
          {subtitle}
        </p>
      </div>
    </button>
  );
}
