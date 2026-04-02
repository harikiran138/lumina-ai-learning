"use client";

import { useState } from "react";
import { BarChart3, Users, Clock, Star, CheckSquare, TrendingUp, TrendingDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const FACULTY = [
  {
    id: "f1",
    name: "Dr. Priya Rao",
    email: "priya.rao@lumina.edu",
    subjects: 3,
    avgVerifyHrs: 0.9,
    gradingSpeed: 98,
    satisfaction: 4.9,
    syllabusComplete: 95,
    attendanceMarked: 100,
    assignmentsCreated: 12,
    status: "excellent",
    trend: "up",
    notes: "Consistently top performer. Role model for department.",
  },
  {
    id: "f2",
    name: "Dr. Meera Nair",
    email: "meera.nair@lumina.edu",
    subjects: 4,
    avgVerifyHrs: 1.2,
    gradingSpeed: 94,
    satisfaction: 4.7,
    syllabusComplete: 88,
    attendanceMarked: 97,
    assignmentsCreated: 9,
    status: "excellent",
    trend: "stable",
    notes: "Strong performer. Minor syllabus delay in one subject.",
  },
  {
    id: "f3",
    name: "Prof. Arjun Das",
    email: "arjun.das@lumina.edu",
    subjects: 5,
    avgVerifyHrs: 3.8,
    gradingSpeed: 72,
    satisfaction: 3.9,
    syllabusComplete: 71,
    attendanceMarked: 88,
    assignmentsCreated: 6,
    status: "watch",
    trend: "down",
    notes: "High subject load may be causing delays. HOD support recommended.",
  },
  {
    id: "f4",
    name: "Mr. Kiran Babu",
    email: "kiran.babu@lumina.edu",
    subjects: 5,
    avgVerifyHrs: 6.2,
    gradingSpeed: 55,
    satisfaction: 3.4,
    syllabusComplete: 62,
    attendanceMarked: 79,
    assignmentsCreated: 4,
    status: "critical",
    trend: "down",
    notes: "Immediate intervention required. SLA breached, syllabus critically behind.",
  },
];

const STATUS_STYLES = {
  excellent: "text-green-400 bg-green-500/10 border-green-500/20",
  watch:     "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  critical:  "text-red-400 bg-red-500/10 border-red-500/20",
};

function Metric({ label, value, good, warn }: { label: string; value: string | number; good: boolean | null; warn?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-gray-500">{label}</p>
      <p className={cn(
        "font-bold mt-0.5",
        good === null ? "text-white" : good ? "text-green-400" : warn ? "text-yellow-400" : "text-red-400"
      )}>
        {value}
      </p>
    </div>
  );
}

export default function FacultyPerformancePage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="glass-v2 border-white/5 p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="rounded-2xl bg-lumina-highlight/10 p-4 border border-lumina-highlight/20 text-lumina-highlight">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">HOD Intelligence</p>
            <h1 className="text-3xl font-display font-bold text-white">Faculty Performance Monitoring</h1>
          </div>
        </div>
        <p className="text-gray-400 leading-relaxed max-w-3xl">
          This is a <strong className="text-white">support and improvement tool</strong>, not a punishment system.
          HOD uses this data to identify faculty who need resources, reduced load, or targeted assistance —
          ensuring every faculty member can deliver their best.
        </p>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <Info className="h-5 w-5 shrink-0 text-yellow-400 mt-0.5" />
          <p className="text-sm text-yellow-200/80">
            Metrics are calculated from AI verification speed, assignment grading timelines, student satisfaction surveys, syllabus pacing data, and attendance records.
          </p>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Excellent", count: FACULTY.filter(f => f.status === "excellent").length, color: "text-green-400 bg-green-500/10 border-green-500/20" },
          { label: "Watch", count: FACULTY.filter(f => f.status === "watch").length, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
          { label: "Critical", count: FACULTY.filter(f => f.status === "critical").length, color: "text-red-400 bg-red-500/10 border-red-500/20" },
          { label: "Total Faculty", count: FACULTY.length, color: "text-lumina-highlight bg-lumina-highlight/10 border-lumina-highlight/20" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-2xl border p-5 text-center", s.color)}>
            <p className="text-3xl font-display font-bold text-white">{s.count}</p>
            <p className="text-xs font-semibold uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Faculty Cards */}
      <div className="space-y-4">
        {FACULTY.map((f) => (
          <div key={f.id} className="glass-v2 border-white/5 overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === f.id ? null : f.id)}
              className="w-full p-6 text-left"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-lumina-highlight/10 flex items-center justify-center text-lumina-highlight font-bold">
                    {f.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-white">{f.name}</p>
                    <p className="text-xs text-gray-400">{f.email} · {f.subjects} subjects</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {f.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : f.trend === "down" ? (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  ) : null}
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded border", STATUS_STYLES[f.status as keyof typeof STATUS_STYLES])}>
                    {f.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
                <Metric label="AI Verify (avg)" value={`${f.avgVerifyHrs}h`} good={f.avgVerifyHrs <= 2} warn={f.avgVerifyHrs <= 4} />
                <Metric label="Grading Speed" value={`${f.gradingSpeed}%`} good={f.gradingSpeed >= 80} warn={f.gradingSpeed >= 65} />
                <Metric label="Satisfaction" value={`${f.satisfaction}/5`} good={f.satisfaction >= 4.0} warn={f.satisfaction >= 3.5} />
                <Metric label="Syllabus" value={`${f.syllabusComplete}%`} good={f.syllabusComplete >= 80} warn={f.syllabusComplete >= 65} />
                <Metric label="Attendance" value={`${f.attendanceMarked}%`} good={f.attendanceMarked >= 90} warn={f.attendanceMarked >= 80} />
              </div>
            </button>

            {expanded === f.id && (
              <div className="border-t border-white/10 px-6 pb-6 pt-4">
                <p className="text-sm text-gray-300 mb-4">
                  <span className="font-semibold text-white">HOD Notes: </span>{f.notes}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button className="py-3 px-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-yellow-400 text-sm font-semibold hover:bg-yellow-500/10 transition-colors">
                    Schedule Support Meeting
                  </button>
                  <button className="py-3 px-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-400 text-sm font-semibold hover:bg-blue-500/10 transition-colors">
                    Assign Teaching Assistant
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
