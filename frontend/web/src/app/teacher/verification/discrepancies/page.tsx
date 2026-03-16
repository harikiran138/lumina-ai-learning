"use client";

import { useState } from "react";
import { 
  AlertCircle, 
  HelpCircle, 
  FileText, 
  RefreshCcw, 
  ChevronRight, 
  ArrowRight,
  ShieldAlert,
  Save,
  Trash2,
  BookOpen,
  Zap,
  CheckCircle2,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Discrepancy {
  id: string;
  field: string;
  sourceValue: string;
  aiValue: string;
  confidence: number;
  location: string;
  severity: "low" | "medium" | "high";
}

export default function DiscrepancyQueuePage() {
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([
    {
      id: "d1",
      field: "Atomic Mass of Carbon",
      sourceValue: "12.011",
      aiValue: "12.00",
      confidence: 0.99,
      location: "Unit 2: Chemistry Basics - Page 42",
      severity: "high"
    },
    {
      id: "d2",
      field: "Execution Context Definition",
      sourceValue: "The environment in which JavaScript code is executed.",
      aiValue: "A container that stores variables and functions.",
      confidence: 0.85,
      location: "Module 3: Advanced JS - Intro",
      severity: "medium"
    },
    {
      id: "d3",
      field: "Date of Magna Carta",
      sourceValue: "1215AD",
      aiValue: "1215",
      confidence: 0.95,
      location: "History Section 1 - Glossary",
      severity: "low"
    }
  ]);

  const resolve = (id: string, winner: "source" | "ai") => {
    setDiscrepancies(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="min-h-screen space-y-8 p-8 max-w-[1400px] mx-auto">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight uppercase italic">Content Discrepancy Queue</h1>
          <p className="mt-2 text-gray-400">Resolving conflicts between PDF sources and AI-generated knowledge maps.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 uppercase tracking-widest animate-pulse">
             {discrepancies.length} Conflicts Detected
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
         <AnimatePresence mode="popLayout">
           {discrepancies.map((d, i) => (
             <motion.div 
               key={d.id}
               layout
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, scale: 0.95 }}
               transition={{ delay: i * 0.1 }}
               className="glass-v2 border-white/5 rounded-3xl overflow-hidden group"
             >
                <div className="flex flex-col lg:flex-row">
                   <div className="lg:w-1/3 p-8 border-r border-white/5 bg-white/[0.01]">
                      <div className="flex items-center gap-3 mb-6">
                         <div className={cn(
                           "p-2 rounded-xl border",
                           d.severity === 'high' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                           d.severity === 'medium' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                           "bg-amber-500/10 border-amber-500/20 text-amber-400"
                         )}>
                            <ShieldAlert className="h-5 w-5" />
                         </div>
                         <h3 className="text-lg font-bold text-white tracking-tight italic uppercase">{d.field}</h3>
                      </div>
                      
                      <div className="space-y-4">
                         <div className="space-y-1">
                            <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Location</p>
                            <p className="text-sm font-medium text-gray-300">{d.location}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Conflict Confidence</p>
                            <div className="flex items-center gap-3">
                               <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-400" style={{ width: `${d.confidence * 100}%` }} />
                               </div>
                               <span className="text-[10px] font-bold text-white italic">{Math.round(d.confidence * 100)}%</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="lg:w-2/3 p-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                      {/* Original Source */}
                      <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <FileText className="h-4 w-4 text-gray-500" />
                               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Source Document</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400 text-[8px] font-bold uppercase tracking-tight">Canonical</span>
                         </div>
                         <div className="p-6 rounded-2xl bg-black/40 border border-yellow-500/20 min-h-[120px] flex items-center justify-center text-center">
                            <p className="text-sm font-medium text-white italic leading-relaxed">"{d.sourceValue}"</p>
                         </div>
                         <button 
                           onClick={() => resolve(d.id, 'source')}
                           className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-yellow-500/20 hover:border-yellow-500/40 transition-all"
                         >
                            Keep Source
                         </button>
                      </div>

                      {/* AI Prediction */}
                      <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <Zap className="h-4 w-4 text-amber-400" />
                               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AI Generated</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[8px] font-bold uppercase tracking-tight">Proposal</span>
                         </div>
                         <div className="p-6 rounded-2xl bg-black/40 border border-amber-500/20 min-h-[120px] flex items-center justify-center text-center">
                            <p className="text-sm font-medium text-white italic leading-relaxed">"{d.aiValue}"</p>
                         </div>
                         <button 
                           onClick={() => resolve(d.id, 'ai')}
                           className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-amber-500/20 hover:border-amber-500/40 transition-all"
                         >
                            Adopt AI
                         </button>
                      </div>

                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                         <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-700">
                            <RefreshCcw className="h-5 w-5 group-hover:rotate-180 transition-all duration-700" />
                         </div>
                      </div>
                   </div>
                </div>
             </motion.div>
           ))}
         </AnimatePresence>

         {discrepancies.length === 0 && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="glass-v2 border-white/5 rounded-3xl p-16 text-center"
            >
               <div className="h-20 w-20 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-yellow-400" />
               </div>
               <h2 className="text-2xl font-bold text-white uppercase italic mb-2 tracking-tight">Knowledge Base Synced</h2>
               <p className="text-gray-500 text-sm max-w-md mx-auto">There are currently no structural discrepancies between the source materials and the generated curriculum models.</p>
               <button className="mt-8 px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all">
                  Run Full Audit
               </button>
            </motion.div>
         )}
      </div>
    </div>
  );
}
