"use client";

import { Timer, AlertOctagon, CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const SLA_THRESHOLD_HRS = 4;

const FACULTY_SLA = [
  {
    id: "f1",
    name: "Mr. Kiran Babu",
    email: "kiran.babu@lumina.edu",
    pendingAnswers: 14,
    avgWaitHrs: 8.2,
    maxWaitHrs: 31.4,
    slaBreached: true,
    studentsBlocked: 11,
    queue: [
      { student: "Rohit Kumar", question: "Derive Bernoulli's equation for viscous flow", waitHrs: 31.4 },
      { student: "Sneha Pillai", question: "Explain DBMS normalization with example", waitHrs: 18.2 },
      { student: "Vikram Singh", question: "What is the difference between JOIN types?", waitHrs: 12.7 },
    ],
  },
  {
    id: "f2",
    name: "Prof. Arjun Das",
    email: "arjun.das@lumina.edu",
    pendingAnswers: 6,
    avgWaitHrs: 4.1,
    maxWaitHrs: 9.8,
    slaBreached: true,
    studentsBlocked: 6,
    queue: [
      { student: "Aditi Sharma", question: "Prove that entropy increases in irreversible processes", waitHrs: 9.8 },
      { student: "Arun Menon", question: "Explain Carnot efficiency derivation", waitHrs: 5.2 },
    ],
  },
  {
    id: "f3",
    name: "Dr. Meera Nair",
    email: "meera.nair@lumina.edu",
    pendingAnswers: 1,
    avgWaitHrs: 1.2,
    maxWaitHrs: 1.5,
    slaBreached: false,
    studentsBlocked: 1,
    queue: [
      { student: "Preethi Iyer", question: "Explain Big-O vs Theta notation with examples", waitHrs: 1.5 },
    ],
  },
  {
    id: "f4",
    name: "Dr. Priya Rao",
    email: "priya.rao@lumina.edu",
    pendingAnswers: 0,
    avgWaitHrs: 0.8,
    maxWaitHrs: 0,
    slaBreached: false,
    studentsBlocked: 0,
    queue: [],
  },
];

export default function SLAMonitorPage() {
  const breached = FACULTY_SLA.filter(f => f.slaBreached);
  const totalBlocked = FACULTY_SLA.reduce((a, f) => a + f.studentsBlocked, 0);
  const totalPending = FACULTY_SLA.reduce((a, f) => a + f.pendingAnswers, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="glass-v2 border-white/5 p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="rounded-2xl bg-lumina-highlight/10 p-4 border border-lumina-highlight/20 text-lumina-highlight">
            <Timer className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">Responsiveness Intelligence</p>
            <h1 className="text-3xl font-display font-bold text-white">AI Verification SLA Monitor</h1>
          </div>
        </div>
        <p className="text-gray-400 leading-relaxed max-w-3xl">
          Faculty are required to verify AI-generated answers within <strong className="text-white">{SLA_THRESHOLD_HRS} hours</strong>.
          HOD monitors this queue to ensure no student remains blocked waiting for a verified answer.
          SLA breaches are escalated automatically.
        </p>

        {breached.length > 0 && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4">
            <AlertOctagon className="h-5 w-5 shrink-0 text-red-400" />
            <p className="text-sm text-red-300">
              <span className="font-bold">{breached.length} faculty member{breached.length > 1 ? "s" : ""}</span> have breached the{" "}
              {SLA_THRESHOLD_HRS}-hour SLA.{" "}
              <span className="font-bold">{totalBlocked} student{totalBlocked > 1 ? "s" : ""}</span> are currently blocked waiting.
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-center">
          <p className="text-3xl font-display font-bold text-white">{breached.length}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-red-400 mt-1">SLA Breaches</p>
        </div>
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 text-center">
          <p className="text-3xl font-display font-bold text-white">{totalPending}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mt-1">Pending Answers</p>
        </div>
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5 text-center">
          <p className="text-3xl font-display font-bold text-white">{totalBlocked}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mt-1">Students Blocked</p>
        </div>
      </div>

      {/* Faculty SLA Cards */}
      <div className="space-y-6">
        {FACULTY_SLA.map((f) => (
          <div
            key={f.id}
            className={cn(
              "glass-v2 border-white/5 overflow-hidden",
              f.slaBreached ? "border-red-500/30" : "border-green-500/20"
            )}
          >
            <div className="p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-11 w-11 rounded-full flex items-center justify-center font-bold",
                    f.slaBreached ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                  )}>
                    {f.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-white">{f.name}</p>
                    <p className="text-xs text-gray-400">{f.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {f.slaBreached ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded border bg-red-500/10 text-red-400 border-red-500/20">
                      <AlertOctagon className="h-3 w-3" /> SLA Breached
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded border bg-green-500/10 text-green-400 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3" /> Compliant
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Pending Answers</p>
                  <p className={cn("font-bold mt-0.5", f.pendingAnswers > 5 ? "text-red-400" : "text-white")}>
                    {f.pendingAnswers}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Wait</p>
                  <p className={cn("font-bold mt-0.5", f.avgWaitHrs > SLA_THRESHOLD_HRS ? "text-red-400" : "text-green-400")}>
                    {f.avgWaitHrs}h
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Max Wait</p>
                  <p className={cn("font-bold mt-0.5", f.maxWaitHrs > SLA_THRESHOLD_HRS ? "text-red-400" : "text-white")}>
                    {f.maxWaitHrs > 0 ? `${f.maxWaitHrs}h` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Students Blocked</p>
                  <p className={cn("font-bold mt-0.5", f.studentsBlocked > 0 ? "text-orange-400" : "text-green-400")}>
                    {f.studentsBlocked}
                  </p>
                </div>
              </div>

              {f.queue.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Pending Queue</p>
                  {f.queue.map((q, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3",
                        q.waitHrs > SLA_THRESHOLD_HRS
                          ? "border-red-500/20 bg-red-500/5"
                          : "border-white/10 bg-white/[0.02]"
                      )}
                    >
                      <Clock className={cn("h-4 w-4 shrink-0 mt-0.5", q.waitHrs > SLA_THRESHOLD_HRS ? "text-red-400" : "text-gray-400")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white">{q.student}</p>
                        <p className="text-xs text-gray-400 truncate">{q.question}</p>
                      </div>
                      <span className={cn("text-xs font-bold shrink-0", q.waitHrs > SLA_THRESHOLD_HRS ? "text-red-400" : "text-gray-400")}>
                        {q.waitHrs}h
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {f.slaBreached && (
                <div className="mt-4 flex gap-3">
                  <button className="py-2 px-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-bold hover:bg-red-500/10 transition-colors flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5" /> Send Urgent Reminder
                  </button>
                  <button className="py-2 px-4 rounded-xl border border-orange-500/20 bg-orange-500/5 text-orange-400 text-xs font-bold hover:bg-orange-500/10 transition-colors">
                    Escalate to Admin
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
