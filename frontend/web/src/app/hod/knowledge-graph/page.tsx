"use client";

import { useState } from "react";
import { Network, TrendingDown, Users, BookOpen, AlertTriangle, Filter, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const TOPICS = [
  { topic: "Thermodynamics",     weakAcross: 3, avgMastery: 41, classes: ["CSE-A", "CSE-B", "ECE-A"], type: "curriculum",  action: "Curriculum review scheduled" },
  { topic: "Linear Algebra",     weakAcross: 3, avgMastery: 44, classes: ["CSE-A", "CSE-C", "ME-B"],  type: "curriculum",  action: "Extra workshops planned" },
  { topic: "Operating Systems",  weakAcross: 2, avgMastery: 53, classes: ["CSE-B", "CSE-C"],          type: "curriculum",  action: "Assignment redesign in progress" },
  { topic: "Database Design",    weakAcross: 2, avgMastery: 58, classes: ["CSE-A", "CSE-B"],          type: "curriculum",  action: "Pending review" },
  { topic: "Data Structures",    weakAcross: 1, avgMastery: 67, classes: ["CSE-C"],                   type: "faculty",     action: "Faculty support scheduled" },
  { topic: "Computer Networks",  weakAcross: 1, avgMastery: 72, classes: ["ECE-B"],                   type: "student",     action: "Peer tutoring assigned" },
  { topic: "Digital Electronics",weakAcross: 2, avgMastery: 49, classes: ["ECE-A", "ECE-C"],          type: "curriculum",  action: "Pending review" },
  { topic: "Fluid Mechanics",    weakAcross: 2, avgMastery: 46, classes: ["ME-A", "ME-B"],            type: "curriculum",  action: "Lab sessions added" },
];

const ISSUE_TYPES = ["all", "curriculum", "faculty", "student"];

const typeConfig = {
  curriculum: { label: "Curriculum Issue",  color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20",    dot: "bg-red-400" },
  faculty:    { label: "Faculty Issue",     color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", dot: "bg-yellow-400" },
  student:    { label: "Student Issue",     color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20",   dot: "bg-blue-400" },
};

function ProgressBar({ value }: { value: number }) {
  const color = value >= 70 ? "bg-green-500" : value >= 55 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
    </div>
  );
}

export default function KnowledgeGraphPage() {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? TOPICS : TOPICS.filter((t) => t.type === filter);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="glass-v2 border-white/5 p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="rounded-2xl bg-lumina-highlight/10 p-4 border border-lumina-highlight/20 text-lumina-highlight">
            <Network className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">Academic Intelligence</p>
            <h1 className="text-3xl font-display font-bold text-white">Cross-Faculty Knowledge Graph</h1>
          </div>
        </div>
        <p className="text-gray-400 leading-relaxed max-w-3xl">
          Aggregated mastery data across all faculty and students, grouped by concept. Topics weak across multiple
          classes indicate <strong className="text-white">curriculum-level issues</strong>, not individual faculty or student failures.
          HOD uses this to make system-level corrections before exams.
        </p>

        {/* Info Box */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <Info className="h-5 w-5 shrink-0 text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-200">
            <p className="font-semibold mb-1">How to read this graph</p>
            <p className="text-blue-300/80">
              Each row is a concept. The number of classes it is weak in determines the issue type.
              Red = likely curriculum problem. Yellow = possible faculty-specific issue. Blue = isolated student clusters.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Curriculum Issues", count: TOPICS.filter(t => t.type === "curriculum").length, icon: BookOpen, color: "text-red-400 bg-red-500/10 border-red-500/20" },
          { label: "Faculty Issues", count: TOPICS.filter(t => t.type === "faculty").length, icon: Users, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
          { label: "Student Issues", count: TOPICS.filter(t => t.type === "student").length, icon: TrendingDown, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-2xl border p-5 flex items-center gap-4", s.color)}>
            <div className={cn("h-12 w-12 rounded-xl border flex items-center justify-center", s.color)}>
              <s.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-white">{s.count}</p>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
        {ISSUE_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl border transition-all",
              filter === t
                ? "bg-lumina-highlight/15 text-lumina-highlight border-lumina-highlight/30"
                : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Topic Rows */}
      <div className="space-y-4">
        {filtered.map((item) => {
          const cfg = typeConfig[item.type as keyof typeof typeConfig];
          return (
            <div key={item.topic} className="glass-v2 border-white/5 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-white">{item.topic}</h3>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", cfg.bg, cfg.color)}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Weak across <span className="font-bold text-white">{item.weakAcross}</span> class{item.weakAcross > 1 ? "es" : ""}
                    {" — "}
                    {item.classes.join(", ")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl font-display font-bold text-white">{item.avgMastery}%</p>
                  <p className="text-xs text-gray-500">avg mastery</p>
                </div>
              </div>
              <ProgressBar value={item.avgMastery} />
              <div className="mt-4 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
                <p className="text-xs text-gray-400">
                  HOD Action: <span className="text-yellow-400 font-semibold">{item.action}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
