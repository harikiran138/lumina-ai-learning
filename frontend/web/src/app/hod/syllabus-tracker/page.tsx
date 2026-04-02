"use client";

import { CheckSquare, AlertTriangle, TrendingDown, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const SUBJECTS = [
  { id: "s1", subject: "Data Structures",      faculty: "Dr. Meera Nair",   covered: 88, total: 100, daysLeft: 22, weeklyTarget: 4, weeklyActual: 4, status: "on-track",  batch: "CSE-A" },
  { id: "s2", subject: "Operating Systems",    faculty: "Dr. Priya Rao",    covered: 95, total: 100, daysLeft: 22, weeklyTarget: 2, weeklyActual: 3, status: "on-track",  batch: "CSE-B" },
  { id: "s3", subject: "Computer Networks",    faculty: "Dr. Meera Nair",   covered: 80, total: 100, daysLeft: 22, weeklyTarget: 4, weeklyActual: 4, status: "on-track",  batch: "CSE-C" },
  { id: "s4", subject: "Thermodynamics",       faculty: "Prof. Arjun Das",  covered: 61, total: 100, daysLeft: 18, weeklyTarget: 6, weeklyActual: 3, status: "delay",     batch: "ME-A" },
  { id: "s5", subject: "Linear Algebra",       faculty: "Prof. Arjun Das",  covered: 58, total: 100, daysLeft: 20, weeklyTarget: 6, weeklyActual: 3, status: "delay",     batch: "CSE-A" },
  { id: "s6", subject: "Database Design",      faculty: "Mr. Kiran Babu",   covered: 47, total: 100, daysLeft: 20, weeklyTarget: 8, weeklyActual: 2, status: "critical",  batch: "CSE-B" },
  { id: "s7", subject: "Fluid Mechanics",      faculty: "Mr. Kiran Babu",   covered: 43, total: 100, daysLeft: 18, weeklyTarget: 9, weeklyActual: 2, status: "critical",  batch: "ME-B" },
  { id: "s8", subject: "Digital Electronics",  faculty: "Dr. Priya Rao",    covered: 76, total: 100, daysLeft: 22, weeklyTarget: 4, weeklyActual: 3, status: "on-track",  batch: "ECE-A" },
];

const STATUS_CONFIG = {
  "on-track": { label: "🟢 On Track",      bar: "bg-green-500", border: "border-green-500/20 bg-green-500/5", badge: "text-green-400 bg-green-500/10 border-green-500/20" },
  "delay":    { label: "🟡 Slight Delay",  bar: "bg-yellow-500", border: "border-yellow-500/20 bg-yellow-500/5", badge: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  "critical": { label: "🔴 Critical",      bar: "bg-red-500",    border: "border-red-500/20 bg-red-500/5",    badge: "text-red-400 bg-red-500/10 border-red-500/20" },
};

function ProgressBar({ value, status }: { value: number; status: string }) {
  const bar = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.bar || "bg-gray-500";
  return (
    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mt-2">
      <div className={cn("h-full rounded-full", bar)} style={{ width: `${value}%` }} />
    </div>
  );
}

export default function SyllabusTrackerPage() {
  const onTrack = SUBJECTS.filter(s => s.status === "on-track").length;
  const delayed = SUBJECTS.filter(s => s.status === "delay").length;
  const critical = SUBJECTS.filter(s => s.status === "critical").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="glass-v2 border-white/5 p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="rounded-2xl bg-lumina-highlight/10 p-4 border border-lumina-highlight/20 text-lumina-highlight">
            <CheckSquare className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">Academic Pacing</p>
            <h1 className="text-3xl font-display font-bold text-white">Syllabus Completion Tracker</h1>
          </div>
        </div>
        <p className="text-gray-400 leading-relaxed max-w-3xl">
          Real-time syllabus coverage vs. remaining academic calendar. HOD can intervene early on critically delayed
          subjects to prevent last-minute rush before exams.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5 text-center">
          <p className="text-3xl font-display font-bold text-white">{onTrack}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-green-400 mt-1">🟢 On Track</p>
        </div>
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 text-center">
          <p className="text-3xl font-display font-bold text-white">{delayed}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mt-1">🟡 Slight Delay</p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-center">
          <p className="text-3xl font-display font-bold text-white">{critical}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-red-400 mt-1">🔴 Critical</p>
        </div>
      </div>

      {/* Subject Rows */}
      <div className="space-y-4">
        {SUBJECTS.sort((a, b) => a.covered - b.covered).map((s) => {
          const cfg = STATUS_CONFIG[s.status as keyof typeof STATUS_CONFIG];
          const needed = s.total - s.covered;
          const pace = s.daysLeft > 0 ? ((needed / s.daysLeft) * 7).toFixed(1) : "—";
          return (
            <div key={s.id} className={cn("rounded-2xl border p-6", cfg.border)}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-white">{s.subject}</h3>
                    <span className="text-[10px] font-mono text-gray-500">{s.batch}</span>
                  </div>
                  <p className="text-sm text-gray-400">{s.faculty}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl font-display font-bold text-white">{s.covered}%</p>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", cfg.badge)}>
                    {cfg.label}
                  </span>
                </div>
              </div>

              <ProgressBar value={s.covered} status={s.status} />

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Days Left</p>
                  <p className={cn("font-bold mt-0.5", s.daysLeft < 20 ? "text-yellow-400" : "text-white")}>{s.daysLeft}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Remaining</p>
                  <p className="font-bold mt-0.5 text-white">{needed}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Required Pace</p>
                  <p className={cn("font-bold mt-0.5", s.status !== "on-track" ? "text-red-400" : "text-white")}>{pace}% / week</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Actual Pace</p>
                  <p className="font-bold mt-0.5 text-white">{s.weeklyActual}% / week</p>
                </div>
              </div>

              {s.status !== "on-track" && (
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                  <span className="text-yellow-300">
                    {s.status === "critical"
                      ? `CRITICAL: Need ${pace}%/week but current rate is only ${s.weeklyActual}%/week. HOD intervention required.`
                      : `Pace is below target. Faculty should be notified to increase coverage speed.`}
                  </span>
                </div>
              )}

              {s.status !== "on-track" && (
                <div className="mt-3 flex gap-3">
                  <button className="py-2 px-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-yellow-400 text-xs font-bold hover:bg-yellow-500/10 transition-colors">
                    Notify Faculty
                  </button>
                  <button className="py-2 px-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-bold hover:bg-blue-500/10 transition-colors">
                    Schedule Extra Class
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
