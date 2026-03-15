"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Filter, 
  Search, 
  ExternalLink, 
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Zap,
  User,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface VerificationItem {
  id: string;
  type: "Assessment" | "Content" | "Correction";
  priority: "High" | "Medium" | "Low";
  source: string;
  description: string;
  timestamp: string;
  ai_confidence: number;
}

export default function VerificationQueuePage() {
  const [items, setItems] = useState<VerificationItem[]>([
    {
      id: "v1",
      type: "Assessment",
      priority: "High",
      source: "Alice Chen - Final Quiz",
      description: "Subjective answer regarding 'Closure Memory Management' requires semantic verification.",
      timestamp: "12 mins ago",
      ai_confidence: 68
    },
    {
      id: "v2",
      type: "Content",
      priority: "Medium",
      source: "Unit 3 Blueprint",
      description: "AI identified a possible factual discrepancy in 'Event Loop' section vs textbook Page 42.",
      timestamp: "45 mins ago",
      ai_confidence: 82
    },
    {
      id: "v3",
      type: "Correction",
      priority: "Low",
      source: "Class Feedback Loop",
      description: "5 students flagged Question #12 as 'Ambiguous'. Rewording suggested.",
      timestamp: "2 hours ago",
      ai_confidence: 94
    }
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setSelectedId(null);
  };

  return (
    <div className="min-h-screen space-y-8 p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Verification Queue
          </h1>
          <p className="mt-2 text-gray-400 max-w-2xl">
            Human-in-the-loop audit for AI decisions. Every critical threshold crossing is routed here for your final approval.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            System Status: Secure
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_450px]">
        <div className="space-y-6">
          <div className="flex items-center justify-between glass-v2 p-4 rounded-2xl border-white/5">
             <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input 
                type="text"
                placeholder="Search queue..."
                className="w-full rounded-xl bg-white/5 border border-white/10 py-2 pl-10 pr-4 text-sm text-white focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg bg-white/5 text-gray-500 hover:text-white transition-all">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "group glass-v2 p-6 rounded-3xl cursor-pointer border-2 transition-all",
                    selectedId === item.id ? "border-amber-400 bg-amber-400/5 shadow-[0_0_20px_rgba(251,191,36,0.1)]" : "border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          item.priority === "High" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          item.priority === "Medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        )}>
                          {item.priority} Priority
                        </span>
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{item.type}</span>
                        <span className="text-[10px] text-gray-700 flex items-center gap-1 font-bold">
                          <Clock className="h-3 w-3" />
                          {item.timestamp}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors uppercase leading-tight">
                        {item.source}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-4">
                       <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">AI Confidence</p>
                        <p className={cn(
                          "text-xl font-display font-bold",
                          item.ai_confidence > 80 ? "text-emerald-400" : "text-amber-400"
                        )}>{item.ai_confidence}%</p>
                      </div>
                      <ChevronRight className={cn("h-5 w-5 text-gray-600 transition-all", selectedId === item.id ? "translate-x-1 text-amber-400" : "")} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {items.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white uppercase italic">Queue Cleared</h4>
                  <p className="text-sm text-gray-500">AI is handling remaining low-priority tasks.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedId ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-v2 border-white/5 p-8 rounded-3xl sticky top-8"
              >
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-amber-400 uppercase tracking-tight flex items-center gap-2">
                       <Zap className="h-5 w-5" />
                       Audit Detail
                    </h3>
                    <button onClick={() => setSelectedId(null)} className="text-gray-500 hover:text-white transition-colors">
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Submission Fragment</p>
                      <p className="text-sm text-gray-300 italic leading-relaxed">
                        "The garbage collector cannot reclaim memory because the inner function creates a persistent reference to the outer scope variable 'configData' via the closure pointer..."
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-400/5 border border-amber-400/10">
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        AI Proposed Grade
                      </p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-display font-bold text-white">4.5 / 5.0</span>
                        <span className="text-xs font-bold text-amber-300">Similarity: 82%</span>
                      </div>
                      <p className="text-xs text-amber-200/60 leading-relaxed">
                        Reasoning: Student correctly identifies the closure mechanism but fails to mention the event loop cycle dependency mentioned in lesson 4.2.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => removeItem(selectedId)}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 p-4 font-bold text-white hover:bg-white/10 transition-all hover:border-red-500/30 group"
                    >
                      <XCircle className="h-5 w-5 group-hover:text-red-400 transition-colors" />
                      Reject
                    </button>
                    <button 
                      onClick={() => removeItem(selectedId)}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 p-4 font-bold text-black hover:bg-amber-300 transition-all shadow-[0_0_30px_rgba(251,191,36,0.2)]"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Approve
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold text-gray-600 uppercase tracking-widest justify-center">
                    <Link href="#" className="hover:text-white transition-colors flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      View context
                    </Link>
                    <div className="h-1 w-1 rounded-full bg-gray-800" />
                    <Link href="#" className="hover:text-white transition-colors flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Manual override
                    </Link>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-v2 border-dashed border-white/10 p-12 rounded-3xl flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center text-gray-700">
                  <User className="h-10 w-10" />
                </div>
                <div>
                   <h4 className="text-lg font-bold text-white uppercase italic">Select Item</h4>
                   <p className="text-sm text-gray-500">Pick an item from the queue to start the verification session.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <section className="glass-v2 border-white/5 p-8 rounded-3xl">
            <h3 className="text-xl font-bold text-white mb-6">Verification Insights</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-display font-bold text-white">92%</p>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Auto-Approval Rate</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-display font-bold text-emerald-400">+4%</p>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Growth vs Last Week</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  Lumina is learning your grading style. 80% of items in the last 24h were approved without changes.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
