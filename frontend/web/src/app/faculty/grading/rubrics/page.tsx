"use client";

import { useState } from "react";
import { 
  Trello, 
  Settings, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Save,
  Copy,
  Layout,
  ChevronRight,
  ShieldCheck,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Criterion {
  id: string;
  name: string;
  weight: number;
  description: string;
  levels: {
    points: number;
    label: string;
    description: string;
  }[];
}

interface Rubric {
  id: string;
  name: string;
  course: string;
  criteria: Criterion[];
  updatedAt: string;
}

export default function RubricManagerPage() {
  const [selectedRubric, setSelectedRubric] = useState<string>("r1");
  const [rubrics, setRubrics] = useState<Rubric[]>([
    {
      id: "r1",
      name: "React Mastery Rubric",
      course: "Advanced Web Systems",
      updatedAt: "2 days ago",
      criteria: [
        {
          id: "c1",
          name: "Prop Management",
          weight: 40,
          description: "Effectiveness of data flow between components.",
          levels: [
            { points: 5, label: "Advanced", description: "Minimal prop drilling, uses context/composition correctly." },
            { points: 3, label: "Proficient", description: "Correct patterns but some over-exposure of state." },
            { points: 1, label: "Developing", description: "Heavy prop drilling and inconsistent state logic." }
          ]
        },
        {
          id: "c2",
          name: "Hook Logic",
          weight: 60,
          description: "Use of useEffect and custom hooks.",
          levels: [
            { points: 5, label: "Clean", description: "Zero dependency array errors, encapsulated side effects." },
            { points: 1, label: "Messy", description: "Direct DOM manipulation inside effects or missing deps." }
          ]
        }
      ]
    }
  ]);

  return (
    <div className="min-h-screen space-y-8 p-8 max-w-[1600px] mx-auto">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight uppercase italic">Rubric Manager</h1>
          <p className="mt-2 text-gray-400">Defining semantic grading standards for AI and human evaluation.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-[10px] font-bold text-white hover:bg-white/10 transition-all uppercase tracking-widest">
            <Copy className="h-4 w-4" />
            Duplicate
          </button>
           <button className="flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-2.5 text-[10px] font-bold text-black hover:bg-amber-300 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            <Plus className="h-4 w-4" />
            New Rubric
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="space-y-4">
           <div className="glass-v2 border-white/5 rounded-3xl p-4">
              <div className="relative mb-4">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                 <input type="text" placeholder="Filter rubrics..." className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none" />
              </div>
              <div className="space-y-2">
                 {rubrics.map(r => (
                    <button 
                      key={r.id}
                      onClick={() => setSelectedRubric(r.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border transition-all duration-300 group",
                        selectedRubric === r.id ? "bg-amber-400/10 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.05)]" : "bg-white/[0.02] border-white/5 hover:border-white/20"
                      )}
                    >
                      <p className={cn("text-xs font-bold uppercase tracking-tight mb-1", selectedRubric === r.id ? "text-amber-400" : "text-white")}>{r.name}</p>
                      <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">{r.course}</p>
                    </button>
                 ))}
              </div>
           </div>

           <div className="glass-v2 border-white/5 rounded-3xl p-6">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">AI Grading Status</h3>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                 <ShieldCheck className="h-4 w-4 text-yellow-400" />
                 <span className="text-[10px] font-bold text-yellow-400 uppercase">Semantic Synced</span>
              </div>
           </div>
        </aside>

        <main className="lg:col-span-3 space-y-8">
           <AnimatePresence mode="wait">
             {rubrics.filter(r => r.id === selectedRubric).map(rubric => (
                <motion.div 
                   key={rubric.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="space-y-8"
                >
                   <div className="glass-v2 border-white/5 rounded-[2.5rem] p-10">
                      <div className="flex items-start justify-between mb-12">
                         <div>
                            <input 
                               type="text" 
                               value={rubric.name}
                               className="bg-transparent border-none text-3xl font-display font-bold text-white uppercase italic tracking-tight focus:outline-none"
                            />
                            <div className="flex items-center gap-4 mt-2">
                               <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                  <Layout className="h-3.5 w-3.5" />
                                  {rubric.course}
                               </div>
                               <div className="h-3 w-px bg-white/10" />
                               <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                  Updated {rubric.updatedAt}
                               </div>
                            </div>
                         </div>
                         <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black font-bold text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                            <Save className="h-4 w-4" />
                            Apply Template
                         </button>
                      </div>

                      <div className="space-y-12">
                         {rubric.criteria.map((criterion, idx) => (
                            <div key={criterion.id} className="relative group">
                               <div className="flex items-center justify-between mb-6">
                                  <div className="flex items-center gap-4">
                                     <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 font-bold italic">
                                        {idx + 1}
                                     </div>
                                     <div>
                                        <h4 className="text-lg font-bold text-white uppercase italic">{criterion.name}</h4>
                                        <p className="text-xs text-gray-500 font-medium">{criterion.description}</p>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-6">
                                     <div className="text-right">
                                        <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mb-1">Weight</p>
                                        <div className="flex items-center gap-2">
                                           <input type="number" value={criterion.weight} className="bg-white/5 border border-white/10 rounded-lg w-16 px-3 py-1 text-sm font-bold text-amber-400 text-center focus:outline-none" />
                                           <span className="text-sm font-bold text-gray-500">%</span>
                                        </div>
                                     </div>
                                     <button className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 className="h-4 w-4" />
                                     </button>
                                  </div>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {criterion.levels.map(level => (
                                     <div key={level.label} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all space-y-4">
                                        <div className="flex items-center justify-between">
                                           <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">{level.label}</span>
                                           <span className="text-xs font-bold text-white italic">{level.points} pts</span>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed min-h-[40px]">{level.description}</p>
                                     </div>
                                  ))}
                                  <button className="flex flex-col items-center justify-center p-6 rounded-2xl border border-dashed border-white/10 hover:bg-white/[0.02] transition-all gap-2 group/add text-gray-600 hover:text-white">
                                     <Plus className="h-5 w-5" />
                                     <span className="text-[10px] font-bold uppercase tracking-widest">Add Level</span>
                                  </button>
                               </div>
                            </div>
                         ))}
                      </div>

                      <button className="w-full mt-12 py-5 rounded-[1.5rem] border border-dashed border-white/10 hover:bg-white/5 hover:border-amber-400/30 transition-all flex items-center justify-center gap-3 text-gray-500 hover:text-amber-400 group">
                         <Plus className="h-6 w-6 group-hover:scale-110 transition-transform" />
                         <span className="text-xs font-bold uppercase tracking-[0.2em] italic">Add New Grading Criterion</span>
                      </button>
                   </div>
                </motion.div>
             ))}
           </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
