"use client";

import { useState } from "react";
import { 
  Zap, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  MessageCircle, 
  ArrowRight,
  Filter,
  Download,
  Clock,
  ExternalLink,
  ShieldAlert,
  Search,
  CheckCircle2,
  Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Intervention {
  id: string;
  studentName: string;
  topic: string;
  priority: "critical" | "high" | "medium";
  reason: string;
  status: "open" | "in-progress" | "resolved";
  createdAt: string;
  confidence: number;
}

export default function InterventionHubPage() {
  const [filter, setFilter] = useState<string>("all");
  const [interventions, setInterventions] = useState<Intervention[]>([
    {
      id: "i1",
      studentName: "David Kim",
      topic: "Async/Await",
      priority: "critical",
      reason: "Mastery below 40% after 3 attempts on Assignment 2.",
      status: "open",
      createdAt: "2 hours ago",
      confidence: 0.96
    },
    {
      id: "i2",
      studentName: "Frank Miller",
      topic: "CSS Selectors",
      priority: "high",
      reason: "High cognitive load detected during recent lab work.",
      status: "in-progress",
      createdAt: "1 day ago",
      confidence: 0.88
    },
    {
      id: "i3",
      studentName: "Charlie Day",
      topic: "React Context",
      priority: "medium",
      reason: "Performance delta of -15% over the last week.",
      status: "open",
      createdAt: "4 hours ago",
      confidence: 0.92
    }
  ]);

  const handleStatusChange = (id: string, newStatus: "in-progress" | "resolved") => {
    setInterventions(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
  };

  return (
    <div className="min-h-screen space-y-8 p-8 max-w-[1500px] mx-auto">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight italic uppercase">Intervention Hub</h1>
          <p className="mt-2 text-gray-400">Targeted support workflows derived from AI risk modeling.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-[10px] font-bold text-white hover:bg-white/10 transition-all uppercase tracking-widest">
            <Download className="h-4 w-4" />
            Export Audit
          </button>
           <button className="flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-2.5 text-[10px] font-bold text-black hover:bg-amber-300 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            <Bell className="h-4 w-4" />
            Broadcast Alerts
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between glass-v2 p-4 rounded-2xl border-white/5">
        <div className="flex items-center gap-4">
           {["all", "critical", "high", "resolved"].map(t => (
              <button 
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                  filter === t ? "bg-white text-black" : "text-gray-500 hover:text-white"
                )}
              >
                {t}
              </button>
           ))}
        </div>
        <div className="flex items-center gap-3 text-gray-600 text-[10px] font-bold uppercase tracking-widest">
           <Filter className="h-4 w-4" />
           Live Filter
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         <AnimatePresence mode="popLayout">
           {interventions.filter(i => filter === 'all' || i.priority === filter || i.status === filter).map((item, i) => (
             <motion.div 
               layout
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95 }}
               transition={{ delay: i * 0.05 }}
               key={item.id} 
               className="group relative glass-v2 border-white/5 rounded-3xl p-8 hover:border-amber-400/20 transition-all overflow-hidden"
             >
                <div className="flex flex-col xl:flex-row items-start xl:items-center gap-8">
                   <div className="flex items-center gap-6 min-w-[250px]">
                      <div className={cn(
                        "h-16 w-16 rounded-2xl flex items-center justify-center border transition-all",
                        item.priority === 'critical' ? "bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]" :
                        item.priority === 'high' ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                        "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      )}>
                         <ShieldAlert className={cn("h-8 w-8", item.priority === 'critical' && "animate-pulse")} />
                      </div>
                      <div>
                         <h3 className="text-xl font-bold text-white uppercase italic tracking-tight mb-1">{item.studentName}</h3>
                         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Topic: <span className="text-white">{item.topic}</span></p>
                      </div>
                   </div>

                   <div className="xl:flex-1 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                         <Zap className="h-3.5 w-3.5 text-amber-400" />
                         AI Diagnostic Insight
                      </div>
                      <p className="text-sm text-gray-300 font-medium leading-relaxed italic">
                        "{item.reason}"
                      </p>
                   </div>

                   <div className="flex flex-col md:flex-row items-center gap-4 min-w-[300px]">
                      <div className="text-center px-4">
                         <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mb-1">Confidence</p>
                         <p className="text-lg font-bold text-white italic">{Math.round(item.confidence * 100)}%</p>
                      </div>
                      <div className="h-10 w-px bg-white/5 hidden md:block" />
                      <div className="flex items-center gap-3">
                         {item.status === 'open' ? (
                            <>
                               <button 
                                 onClick={() => handleStatusChange(item.id, 'in-progress')}
                                 className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all"
                               >
                                  Start Review
                               </button>
                               <button 
                                 onClick={() => handleStatusChange(item.id, 'resolved')}
                                 className="px-6 py-2.5 rounded-xl bg-white text-black font-bold text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                               >
                                  Auto-Fix
                               </button>
                            </>
                         ) : (
                            <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-bold text-yellow-400 uppercase tracking-widest">
                               <CheckCircle2 className="h-4 w-4" />
                               {item.status}
                            </div>
                         )}
                         <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all">
                            <MessageCircle className="h-5 w-5" />
                         </button>
                      </div>
                   </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-[8px] font-bold text-gray-700 tracking-[0.2em] uppercase">
                   <div className="flex items-center gap-4">
                      <span>Detected: {item.createdAt}</span>
                      <span>ID: {item.id}</span>
                   </div>
                   <div className="flex items-center gap-2 group/link cursor-pointer">
                      <span className="group-hover/link:text-white transition-colors">Open Student 360</span>
                      <ArrowRight className="h-3 w-3 group-hover/link:translate-x-1 transition-transform" />
                   </div>
                </div>
             </motion.div>
           ))}
         </AnimatePresence>

         {interventions.length === 0 && (
            <div className="glass-v2 border-white/5 rounded-3xl p-20 text-center">
               <div className="h-24 w-24 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                  <CheckCircle className="h-12 w-12 text-yellow-400" />
               </div>
               <h2 className="text-3xl font-display font-bold text-white uppercase italic tracking-tighter mb-4">No Active Interventions</h2>
               <p className="text-gray-500 text-sm max-w-sm mx-auto">All students are currently performing within expected cognitive and mastery thresholds.</p>
            </div>
         )}
      </div>
    </div>
  );
}
