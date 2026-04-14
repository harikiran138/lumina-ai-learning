"use client";

import { useState } from "react";
import { Bell, AlertOctagon, AlertTriangle, Info, CheckCircle2, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ALERTS = [
  { id: "a1", type: "critical", category: "SLA",        title: "SLA Breach — Mr. Kiran Babu",             desc: "14 unanswered student questions. Max wait: 31.4 hours. Students are blocked.",                  time: "10 min ago",  resolved: false },
  { id: "a2", type: "critical", category: "At-Risk",    title: "Critical At-Risk Student — Rohit Kumar",  desc: "Failing 4 subjects with 31% mastery. No faculty contact in 3 days. Counselor not assigned.",   time: "25 min ago",  resolved: false },
  { id: "a3", type: "warning",  category: "Syllabus",   title: "Critical Syllabus Delay — Database Design",desc: "Only 47% complete with 20 days left. Required pace: 8%/week. Actual: 2%/week.",                time: "1 hr ago",    resolved: false },
  { id: "a4", type: "warning",  category: "Syllabus",   title: "Syllabus Delay — Fluid Mechanics",        desc: "43% covered with 18 days remaining. Mr. Kiran Babu teaching.",                               time: "1 hr ago",    resolved: false },
  { id: "a5", type: "warning",  category: "SLA",        title: "SLA Near-Breach — Prof. Arjun Das",       desc: "6 pending answers. Avg wait 4.1 hours. SLA threshold is 4 hours.",                           time: "2 hrs ago",   resolved: false },
  { id: "a6", type: "info",     category: "Knowledge",  title: "Knowledge Pattern Detected",              desc: "Thermodynamics mastery below 45% across 3 classes. Likely curriculum issue.",                  time: "4 hrs ago",   resolved: false },
  { id: "a7", type: "info",     category: "Knowledge",  title: "Knowledge Pattern Detected",              desc: "Linear Algebra mastery below 50% in 3 batches (CSE-A, CSE-C, ME-B). Possible curriculum gap.", time: "4 hrs ago",   resolved: false },
  { id: "a8", type: "info",     category: "Faculty",    title: "Monthly Review Pending",                  desc: "Performance review due for Prof. Arjun Das. Please schedule within 5 days.",                  time: "Yesterday",   resolved: false },
  { id: "a9", type: "info",     category: "Alumni",     title: "New Alumni Feedback Received",            desc: "18 new relevance scores submitted. Operating Systems rated 38% — review recommended.",         time: "Yesterday",   resolved: true },
  { id: "a10",type: "warning",  category: "At-Risk",    title: "Student Performance Drop",                desc: "Sneha Pillai dropped from 68% to 42% mastery in 2 weeks across 3 subjects.",                  time: "2 days ago",  resolved: false },
];

const TYPE_CONFIG = {
  critical: {
    icon: AlertOctagon,
    border: "border-red-500/20 bg-red-500/5",
    iconColor: "text-red-400 bg-red-500/10",
    label: "Critical",
    labelStyle: "text-red-400 bg-red-500/10 border-red-500/20",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-yellow-500/20 bg-yellow-500/5",
    iconColor: "text-yellow-400 bg-yellow-500/10",
    label: "Warning",
    labelStyle: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  },
  info: {
    icon: Info,
    border: "border-blue-500/20 bg-blue-500/5",
    iconColor: "text-blue-400 bg-blue-500/10",
    label: "Info",
    labelStyle: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
};

const CATEGORIES = ["all", "SLA", "At-Risk", "Syllabus", "Knowledge", "Faculty", "Alumni"];

export default function AlertsPage() {
  const [filter, setFilter] = useState("all");
  const [resolved, setResolved] = useState<Set<string>>(
    new Set(ALERTS.filter(a => a.resolved).map(a => a.id))
  );

  const dismiss = (id: string) => setResolved(prev => new Set([...prev, id]));

  const visible = ALERTS.filter(a =>
    !resolved.has(a.id) &&
    (filter === "all" || a.category === filter)
  );

  const critical = visible.filter(a => a.type === "critical").length;
  const warnings = visible.filter(a => a.type === "warning").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="glass-v2 border-white/5 p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="rounded-2xl bg-lumina-highlight/10 p-4 border border-lumina-highlight/20 text-lumina-highlight">
            <Bell className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">Department Intelligence</p>
            <h1 className="text-3xl font-display font-bold text-white">Alert Center</h1>
          </div>
        </div>
        <p className="text-gray-400 leading-relaxed max-w-3xl">
          All department-level anomalies, SLA breaches, student risk signals, and system notifications in one place.
          HOD acts on alerts <strong className="text-white">before they escalate</strong>.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-center">
          <p className="text-3xl font-display font-bold text-white">{critical}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-red-400 mt-1">Critical Alerts</p>
        </div>
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 text-center">
          <p className="text-3xl font-display font-bold text-white">{warnings}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mt-1">Warnings</p>
        </div>
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5 text-center">
          <p className="text-3xl font-display font-bold text-white">{resolved.size}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-green-400 mt-1">Dismissed</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl border transition-all",
              filter === cat
                ? "bg-lumina-highlight/15 text-lumina-highlight border-lumina-highlight/30"
                : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Alert List */}
      {visible.length === 0 ? (
        <div className="glass-v2 border-white/5 p-12 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-4 text-green-400" />
          <h3 className="text-lg font-semibold text-white">All clear</h3>
          <p className="text-sm text-gray-400 mt-2">No active alerts in this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.sort((a, b) => {
            const order = { critical: 0, warning: 1, info: 2 };
            return order[a.type as keyof typeof order] - order[b.type as keyof typeof order];
          }).map((alert) => {
            const cfg = TYPE_CONFIG[alert.type as keyof typeof TYPE_CONFIG];
            const Icon = cfg.icon;
            return (
              <div key={alert.id} className={cn("rounded-2xl border p-5 flex items-start gap-4", cfg.border)}>
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", cfg.iconColor)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <p className="font-semibold text-white">{alert.title}</p>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", cfg.labelStyle)}>
                      {alert.type}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 bg-white/5 text-gray-400">
                      {alert.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{alert.desc}</p>
                  <p className="text-xs text-gray-600 mt-1">{alert.time}</p>
                </div>
                <button
                  onClick={() => dismiss(alert.id)}
                  className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                  title="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
