"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  AlertTriangle, 
  TrendingDown, 
  Clock, 
  Zap, 
  Search, 
  Filter,
  ChevronRight,
  MessageSquare,
  Sparkles,
  User,
  Activity,
  UserMinus
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  student_name: string;
  type: "performance" | "dropout" | "engagement";
  severity: "critical" | "warning" | "stable";
  description: string;
  probability?: number;
  trend: string;
  timestamp: string;
}

export default function AtRiskAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: "a1",
      student_name: "Alice Chen",
      type: "performance",
      severity: "critical",
      description: "Mastery in 'Asynchronous Execution' dropped by 42% in the last 48 hours.",
      probability: 0.82,
      trend: "Sharp Decline",
      timestamp: "2 hours ago"
    },
    {
      id: "a2",
      student_name: "David Kim",
      type: "engagement",
      severity: "warning",
      description: "Class attendance dropped from 98% to 65% since last week.",
      trend: "Negative engagement velocity",
      timestamp: "5 hours ago"
    },
    {
      id: "a3",
      student_name: "Charlie Day",
      type: "dropout",
      severity: "critical",
      description: "Behavioral patterns match historic dropout profiles (Low activity + pending assignments).",
      probability: 0.65,
      trend: "High Risk",
      timestamp: "1 day ago"
    }
  ]);

  return (
    <div className="min-h-screen space-y-8 p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            At-Risk Alerts
          </h1>
          <p className="mt-2 text-gray-400 max-w-2xl">
            Early warning system using the Dropout Predictive Model. Intervene before friction becomes failure.
          </p>
        </div>

        <div className="flex items-center gap-3">
           <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-2">
            <UserMinus className="h-4 w-4" />
            3 Critical Interventions Needed
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between glass-v2 p-4 rounded-2xl border-white/5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input 
            type="text"
            placeholder="Search students or alert types..."
            className="w-full rounded-xl bg-white/5 border border-white/10 py-2 pl-10 pr-4 text-sm text-white focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          {["All", "Critical", "Warning", "Stable"].map(f => (
            <button key={f} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-all">
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "group glass-v2 border-white/5 overflow-hidden rounded-3xl border-2 transition-all p-8 flex flex-col md:flex-row md:items-center gap-8",
                alert.severity === "critical" ? "border-red-500/20 bg-red-500/[0.02]" : "border-white/5"
              )}
            >
              <div className="flex items-center gap-6 flex-1">
                <div className={cn(
                  "h-16 w-16 rounded-3xl flex items-center justify-center text-white",
                  alert.severity === "critical" ? "bg-red-500/20 text-red-500" : "bg-amber-500/20 text-amber-500"
                )}>
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      alert.severity === "critical" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    )}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{alert.type} Alert</span>
                    <span className="text-[10px] text-gray-700 font-bold uppercase">{alert.timestamp}</span>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white group-hover:text-amber-400 transition-colors uppercase">
                    {alert.student_name}
                  </h3>
                  <p className="text-sm text-gray-400 max-w-xl">{alert.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Impact Probability</p>
                  <p className={cn(
                    "text-3xl font-display font-bold",
                    alert.severity === "critical" ? "text-red-400" : "text-amber-400"
                  )}>{alert.probability ? `${alert.probability * 100}%` : "High"}</p>
                </div>
                <div className="flex flex-col gap-2 min-w-[180px]">
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black py-2.5 text-xs font-bold hover:bg-gray-200 transition-all">
                    <Sparkles className="h-3 w-3" />
                    Intervene Now
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-all">
                    <MessageSquare className="h-3 w-3" />
                    Contact Parent
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-v2 border-white/5 p-8 rounded-3xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
             <Activity className="h-5 w-5 text-blue-400" />
             At-Risk Distribution
          </h3>
          <div className="space-y-6">
             {[
               { name: "Academic performance", count: 8, color: "bg-red-400" },
               { name: "Attendance / Participation", count: 12, color: "bg-amber-400" },
               { name: "Behavioral Anomaly", count: 3, color: "bg-blue-400" }
             ].map((stat, i) => (
               <div key={i} className="space-y-2">
                 <div className="flex justify-between text-xs font-bold">
                    <span className="text-white uppercase">{stat.name}</span>
                    <span className="text-gray-500">{stat.count} Students</span>
                 </div>
                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className={cn("h-full", stat.color)} style={{ width: `${(stat.count / 23) * 100}%` }} />
                 </div>
               </div>
             ))}
          </div>
        </section>

        <section className="glass-v2 border-white/5 p-8 rounded-3xl bg-amber-400/[0.02]">
           <h3 className="text-xl font-bold text-amber-500 mb-6 flex items-center gap-2 uppercase tracking-tight">
             <Zap className="h-5 w-5" />
             AI Preventive Engine
           </h3>
           <p className="text-sm text-gray-400 leading-relaxed mb-6">
             Lumina has identified a cohort-wide friction point in 'Module 4: Recursion'. We have automatically drafted a simplified visual mental model for these 12 students.
           </p>
           <button className="w-full py-4 rounded-2xl bg-amber-400 text-black font-bold hover:bg-amber-300 transition-all shadow-[0_0_30px_rgba(251,191,36,0.1)]">
             Review & Blast Batch Intervention
           </button>
        </section>
      </div>
    </div>
  );
}
