"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  ChevronRight, 
  Settings,
  ShieldCheck,
  AlertCircle,
  Clock,
  User,
  Zap,
  RefreshCw,
  Search
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Scaffold {
  id: string;
  topic: string;
  strategy: "scaffolding" | "fading" | "modeling";
  content: string;
  confidence: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export default function ScaffoldApprovalPage() {
  const [scaffolds, setScaffolds] = useState<Scaffold[]>([
    {
      id: "sc1",
      topic: "React Hook Order",
      strategy: "scaffolding",
      content: "Explain that hooks must be at the top level. Use a comparison to a list of instructions that cannot be skipped.",
      confidence: 0.94,
      status: "pending",
      createdAt: "10 mins ago"
    },
    {
      id: "sc2",
      topic: "CSS Grid Alignment",
      strategy: "modeling",
      content: "Show a live example of 'align-items' vs 'justify-content' using a 2x2 grid. Highlight the axes clearly.",
      confidence: 0.88,
      status: "pending",
      createdAt: "25 mins ago"
    },
    {
      id: "sc3",
      topic: "Cognitive Load Management",
      strategy: "fading",
      content: "Gradually remove step-by-step instructions for API fetch and let student implement the error handler first.",
      confidence: 0.96,
      status: "pending",
      createdAt: "1 hour ago"
    }
  ]);

  const handleAction = (id: string, status: "approved" | "rejected") => {
    setScaffolds(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  return (
    <div className="min-h-screen space-y-8 p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Scaffold Approval</h1>
          <p className="mt-2 text-gray-400">Review and approve AI-generated pedagogical strategies.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
             <Clock className="h-4 w-4 text-amber-400" />
             <span className="text-xs font-bold text-white uppercase tracking-widest">{scaffolds.filter(s => s.status === 'pending').length} PENDING</span>
          </div>
          <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-4">
           {scaffolds.filter(s => s.status === 'pending').map((scaffold, i) => (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               key={scaffold.id} 
               className="group relative glass-v2 rounded-3xl border-white/5 p-6 hover:border-amber-400/30 transition-all overflow-hidden"
             >
                <div className="absolute top-0 right-0 p-4">
                   <div className={cn(
                     "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                     scaffold.confidence > 0.9 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                   )}>
                     {Math.round(scaffold.confidence * 100)}% Match
                   </div>
                </div>

                <div className="flex items-start gap-4 mb-6">
                   <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-amber-400 border border-white/10">
                      <Zap className="h-6 w-6" />
                   </div>
                   <div>
                      <h3 className="text-lg font-bold text-white uppercase tracking-tight italic">{scaffold.topic}</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                        Pedagogy: <span className="text-amber-400">{scaffold.strategy}</span> • Generated {scaffold.createdAt}
                      </p>
                   </div>
                </div>

                <div className="bg-black/40 rounded-2xl p-6 border border-white/5 mb-6">
                   <p className="text-sm text-gray-300 leading-relaxed font-medium">
                      {scaffold.content}
                   </p>
                </div>

                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <button className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white">
                        <MessageSquare className="h-4 w-4" />
                        Edit Draft
                      </button>
                      <button className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white">
                        <RefreshCw className="h-4 w-4" />
                        Regenerate
                      </button>
                   </div>
                   <div className="flex items-center gap-3">
                      <button 
                         onClick={() => handleAction(scaffold.id, "rejected")}
                         className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-6 py-2.5 text-[10px] font-bold text-red-400 hover:bg-red-500/20 transition-all uppercase tracking-widest"
                      >
                         <XCircle className="h-4 w-4" />
                         Reject
                      </button>
                      <button 
                         onClick={() => handleAction(scaffold.id, "approved")}
                         className="flex items-center gap-2 rounded-xl bg-white border border-white px-8 py-2.5 text-[10px] font-bold text-black hover:bg-gray-200 transition-all uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                      >
                         <ShieldCheck className="h-4 w-4" />
                         Approve
                      </button>
                   </div>
                </div>
             </motion.div>
           ))}

           {scaffolds.filter(s => s.status === 'pending').length === 0 && (
              <div className="glass-v2 rounded-3xl border-white/5 p-12 text-center">
                 <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                 </div>
                 <h2 className="text-2xl font-bold text-white uppercase italic mb-2">Queue Clear</h2>
                 <p className="text-gray-500 text-sm">All generated scaffolds have been reviewed and applied.</p>
              </div>
           )}
        </div>

        <div className="space-y-6">
           <div className="glass-v2 border-white/5 rounded-3xl p-6">
              <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-6">System Health</h4>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-gray-400">AI Consistency</span>
                    <span className="text-emerald-400">98.2%</span>
                 </div>
                 <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-gray-400">Teacher Override Rate</span>
                    <span className="text-white">4.5%</span>
                 </div>
                 <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-gray-400">Active Students</span>
                    <span className="text-white">821</span>
                 </div>
              </div>
           </div>

           <div className="glass-v2 border-white/5 rounded-3xl p-6">
              <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Strategy Breakdown</h4>
              <div className="space-y-6">
                 {[
                   { label: "Scaffolding", pct: 65, color: "bg-blue-400" },
                   { label: "Fading", pct: 20, color: "bg-amber-400" },
                   { label: "Modeling", pct: 15, color: "bg-purple-400" }
                 ].map(item => (
                   <div key={item.label} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                        <span className="text-gray-500">{item.label}</span>
                        <span className="text-white">{item.pct}%</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className={cn("h-full", item.color)} style={{ width: `${item.pct}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
