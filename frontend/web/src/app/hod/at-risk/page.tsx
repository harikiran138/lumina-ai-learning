"use client";

import { AlertOctagon, Users, BookOpen, Activity, MessageSquare, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const AT_RISK_STUDENTS = [
  {
    id: "s1",
    name: "Rohit Kumar",
    email: "rohit.kumar@lumina.edu",
    batch: "CSE-B",
    failingSubjects: ["Database Design", "Thermodynamics", "Linear Algebra", "Operating Systems"],
    avgMastery: 31,
    lastActive: "3 days ago",
    risk: "critical",
    attendance: 58,
    counselorAssigned: false,
    pattern: "Consistent decline over 4 weeks. Missing assignments in all subjects.",
  },
  {
    id: "s2",
    name: "Sneha Pillai",
    email: "sneha.pillai@lumina.edu",
    batch: "CSE-A",
    failingSubjects: ["Thermodynamics", "Fluid Mechanics", "Linear Algebra"],
    avgMastery: 42,
    lastActive: "1 day ago",
    risk: "high",
    attendance: 71,
    counselorAssigned: true,
    pattern: "Weak in theory-heavy subjects. Strong in practicals. May need study support.",
  },
  {
    id: "s3",
    name: "Vikram Singh",
    email: "vikram.singh@lumina.edu",
    batch: "ME-A",
    failingSubjects: ["Thermodynamics", "Fluid Mechanics"],
    avgMastery: 50,
    lastActive: "Today",
    risk: "medium",
    attendance: 82,
    counselorAssigned: false,
    pattern: "Weak only in core mechanical subjects. Regular attendance is positive signal.",
  },
  {
    id: "s4",
    name: "Aditi Sharma",
    email: "aditi.sharma@lumina.edu",
    batch: "CSE-B",
    failingSubjects: ["Database Design", "Data Structures"],
    avgMastery: 55,
    lastActive: "2 days ago",
    risk: "medium",
    attendance: 78,
    counselorAssigned: false,
    pattern: "Struggling with implementation-heavy subjects. Conceptual understanding seems intact.",
  },
];

const RISK_CONFIG = {
  critical: { label: "Critical Risk",  border: "border-red-500/30 bg-red-500/5",    badge: "text-red-400 bg-red-500/10 border-red-500/20",    dot: "bg-red-500" },
  high:     { label: "High Risk",      border: "border-orange-500/20 bg-orange-500/5", badge: "text-orange-400 bg-orange-500/10 border-orange-500/20", dot: "bg-orange-500" },
  medium:   { label: "Medium Risk",    border: "border-yellow-500/20 bg-yellow-500/5", badge: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", dot: "bg-yellow-500" },
};

export default function AtRiskPage() {
  const critical = AT_RISK_STUDENTS.filter(s => s.risk === "critical").length;
  const high = AT_RISK_STUDENTS.filter(s => s.risk === "high").length;
  const medium = AT_RISK_STUDENTS.filter(s => s.risk === "medium").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="glass-v2 border-white/5 p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="rounded-2xl bg-red-500/10 p-4 border border-red-500/20 text-red-400">
            <AlertOctagon className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">Student Intelligence</p>
            <h1 className="text-3xl font-display font-bold text-white">At-Risk Student Analysis</h1>
          </div>
        </div>
        <p className="text-gray-400 leading-relaxed max-w-3xl">
          HOD sees students struggling <strong className="text-white">across multiple subjects and batches</strong>.
          Patterns here help distinguish individual struggles from systemic issues.
          HOD coordinates with counselors and faculty for early, targeted intervention.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-center">
          <p className="text-3xl font-display font-bold text-white">{critical}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-red-400 mt-1">Critical Risk</p>
        </div>
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5 text-center">
          <p className="text-3xl font-display font-bold text-white">{high}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mt-1">High Risk</p>
        </div>
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 text-center">
          <p className="text-3xl font-display font-bold text-white">{medium}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mt-1">Medium Risk</p>
        </div>
      </div>

      {/* Student Cards */}
      <div className="space-y-5">
        {AT_RISK_STUDENTS.map((s) => {
          const cfg = RISK_CONFIG[s.risk as keyof typeof RISK_CONFIG];
          return (
            <div key={s.id} className={cn("rounded-2xl border p-6", cfg.border)}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("h-11 w-11 rounded-full flex items-center justify-center font-bold text-white", cfg.dot)}>
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">{s.name}</p>
                      <span className="text-xs font-mono text-gray-500">{s.batch}</span>
                    </div>
                    <p className="text-xs text-gray-400">{s.email}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Last active: {s.lastActive}</p>
                  </div>
                </div>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded border shrink-0", cfg.badge)}>
                  {cfg.label}
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Mastery</p>
                  <p className={cn("font-bold mt-0.5", s.avgMastery < 40 ? "text-red-400" : s.avgMastery < 55 ? "text-orange-400" : "text-yellow-400")}>
                    {s.avgMastery}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Attendance</p>
                  <p className={cn("font-bold mt-0.5", s.attendance < 65 ? "text-red-400" : s.attendance < 80 ? "text-yellow-400" : "text-white")}>
                    {s.attendance}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Failing Subjects</p>
                  <p className="font-bold mt-0.5 text-white">{s.failingSubjects.length}</p>
                </div>
              </div>

              {/* Failing Subjects */}
              <div className="mb-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Failing In</p>
                <div className="flex flex-wrap gap-2">
                  {s.failingSubjects.map((sub) => (
                    <span key={sub} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Pattern */}
              <div className="flex items-start gap-2 rounded-xl bg-white/5 border border-white/10 p-3 mb-4">
                <TrendingDown className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400"><span className="font-semibold text-white">AI Pattern:</span> {s.pattern}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 flex-wrap">
                <button className="py-2 px-4 rounded-xl border border-purple-500/20 bg-purple-500/5 text-purple-400 text-xs font-bold hover:bg-purple-500/10 transition-colors flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  {s.counselorAssigned ? "Update Counselor" : "Assign Counselor"}
                </button>
                <button className="py-2 px-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-bold hover:bg-blue-500/10 transition-colors flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> Assign Extra Material
                </button>
                <button className="py-2 px-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-yellow-400 text-xs font-bold hover:bg-yellow-500/10 transition-colors flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Notify Faculty
                </button>
              </div>

              {s.counselorAssigned && (
                <p className="mt-3 text-xs text-purple-400 flex items-center gap-1.5">
                  <Activity className="h-3 w-3" /> Counselor session already scheduled for this student.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
