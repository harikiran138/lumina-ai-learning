"use client";

import { useState } from "react";
import { Zap, BookOpen, CalendarCheck, MessageSquare, Shield, Activity, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const INTERVENTION_TYPES = [
  {
    id: "extra-content",
    icon: BookOpen,
    label: "Assign Extra Content",
    desc: "Push supplementary material, videos, or practice problems to struggling students or entire classes.",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    form: ["Target (student / class / subject)", "Material type", "Due date"],
  },
  {
    id: "revision-class",
    icon: CalendarCheck,
    label: "Schedule Revision Class",
    desc: "Book a focused revision session for a specific weak topic across one or more classes.",
    color: "text-green-400 bg-green-500/10 border-green-500/20",
    form: ["Topic", "Faculty", "Date & time", "Batches included"],
  },
  {
    id: "faculty-meeting",
    icon: MessageSquare,
    label: "Call Faculty Meeting",
    desc: "Convene a department-level meeting to discuss systemic academic patterns and corrective measures.",
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    form: ["Agenda", "Participants", "Scheduled date"],
  },
  {
    id: "escalate-admin",
    icon: Shield,
    label: "Escalate to Admin",
    desc: "Flag critical issues to institutional leadership when they exceed departmental authority.",
    color: "text-red-400 bg-red-500/10 border-red-500/20",
    form: ["Issue description", "Priority level", "Attachments"],
  },
  {
    id: "counselor",
    icon: Activity,
    label: "Trigger Counselor Support",
    desc: "Connect specific at-risk students with the well-being and counseling team immediately.",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    form: ["Student name(s)", "Risk signal", "Counselor assigned"],
  },
  {
    id: "monitor",
    icon: TrendingUp,
    label: "Monitor Improvement",
    desc: "Mark a previous intervention for tracking and receive weekly progress updates from AI.",
    color: "text-lumina-highlight bg-lumina-highlight/10 border-lumina-highlight/20",
    form: ["Linked intervention", "Success metric", "Review date"],
  },
];

const INTERVENTION_LOG = [
  { id: "i1", type: "revision-class",   label: "Revision Class",       subject: "Thermodynamics",    date: "2026-03-28", status: "completed", result: "Mastery up 8% in 1 week" },
  { id: "i2", type: "extra-content",    label: "Extra Content",        subject: "Database Design",   date: "2026-03-30", status: "active",    result: "Ongoing" },
  { id: "i3", type: "counselor",        label: "Counselor Support",    subject: "Rohit Kumar",       date: "2026-04-01", status: "active",    result: "Session scheduled" },
  { id: "i4", type: "faculty-meeting",  label: "Faculty Meeting",      subject: "Linear Algebra",    date: "2026-03-25", status: "completed", result: "Curriculum update decided" },
  { id: "i5", type: "escalate-admin",   label: "Admin Escalation",     subject: "SLA Non-compliance",date: "2026-04-01", status: "pending",   result: "Awaiting response" },
];

const STATUS_STYLES = {
  completed: "text-green-400 bg-green-500/10 border-green-500/20",
  active:    "text-blue-400 bg-blue-500/10 border-blue-500/20",
  pending:   "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
};

export default function InterventionsPage() {
  const [activeForm, setActiveForm] = useState<string | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="glass-v2 border-white/5 p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="rounded-2xl bg-lumina-highlight/10 p-4 border border-lumina-highlight/20 text-lumina-highlight">
            <Zap className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">HOD Action System</p>
            <h1 className="text-3xl font-display font-bold text-white">Intervention Toolkit</h1>
          </div>
        </div>
        <p className="text-gray-400 leading-relaxed max-w-3xl">
          HOD acts early — before exams, not after failure. Every intervention is logged and tracked for effectiveness.
          AI monitors outcomes and reports back with measurable improvement data.
        </p>
      </div>

      {/* Action Grid */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Available Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INTERVENTION_TYPES.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveForm(activeForm === item.id ? null : item.id)}
              className={cn(
                "rounded-2xl border p-5 text-left hover:opacity-90 transition-all",
                activeForm === item.id ? item.color + " ring-2 ring-offset-2 ring-offset-black" : "border-white/10 bg-white/[0.02] hover:border-white/20"
              )}
            >
              <div className={cn("h-11 w-11 rounded-xl border flex items-center justify-center mb-3", item.color)}>
                <item.icon className="h-5 w-5" />
              </div>
              <p className="font-bold text-white mb-1">{item.label}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Inline Form */}
      {activeForm && (() => {
        const action = INTERVENTION_TYPES.find(a => a.id === activeForm);
        if (!action) return null;
        return (
          <div className={cn("rounded-2xl border p-6", action.color)}>
            <div className="flex items-center gap-3 mb-5">
              <action.icon className="h-5 w-5" />
              <h3 className="font-bold text-white">{action.label}</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {action.form.map((field) => (
                <div key={field}>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{field}</label>
                  <input
                    type="text"
                    placeholder={`Enter ${field.toLowerCase()}...`}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-lumina-highlight transition-colors placeholder:text-gray-600"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button className="flex-1 py-3 rounded-xl bg-lumina-highlight text-black font-bold text-sm hover:opacity-90 transition-opacity">
                Log Intervention
              </button>
              <button onClick={() => setActiveForm(null)} className="py-3 px-5 rounded-xl border border-white/10 text-gray-400 font-bold text-sm hover:bg-white/5 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        );
      })()}

      {/* Intervention Log */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Intervention Log</h2>
        <div className="glass-v2 border-white/5 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Type</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Target</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {INTERVENTION_LOG.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4 text-sm font-semibold text-white">{log.label}</td>
                  <td className="px-5 py-4 text-sm text-gray-400">{log.subject}</td>
                  <td className="px-5 py-4 text-sm text-gray-400">{log.date}</td>
                  <td className="px-5 py-4">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", STATUS_STYLES[log.status as keyof typeof STATUS_STYLES])}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-300">{log.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
