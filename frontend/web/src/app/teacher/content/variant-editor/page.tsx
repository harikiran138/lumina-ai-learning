"use client";

import { useState } from "react";
import { 
  Split, 
  Layers, 
  MessageCircle, 
  Save, 
  ArrowLeft,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Wand2,
  Settings2,
  Search,
  CheckCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Variant {
  id: string;
  label: string;
  content: string;
  difficulty: "easy" | "medium" | "hard";
  tone: string;
  isActive: boolean;
}

export default function VariantEditorPage() {
  const [selectedVariant, setSelectedVariant] = useState<string>("v1");
  const [variants, setVariants] = useState<Variant[]>([
    { id: "v1", label: "Default", content: "Explain the Pythagorean theorem using a triangle with sides 3, 4, 5.", difficulty: "medium", tone: "Formal", isActive: true },
    { id: "v2", label: "Visual-Story", content: "Tell a story about a traveler walking across a rectangular field diagonally.", difficulty: "easy", tone: "Casual", isActive: false },
    { id: "v3", label: "Math-Rigorous", content: "Prove the theorem using square areas and algebraic expansion.", difficulty: "hard", tone: "Academic", isActive: false },
  ]);

  return (
    <div className="min-h-screen space-y-8 p-8 max-w-[1600px] mx-auto">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/teacher/content/questions" className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight uppercase italic">Variant Editor</h1>
            <p className="text-sm text-gray-500 font-medium">Question #422: Introduction to Geometry</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-all">
            <Copy className="h-4 w-4" />
            Duplicate Set
          </button>
           <button className="flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-2.5 text-xs font-bold text-black hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            <Save className="h-4 w-4" />
            Publish Changes
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
           <div className="glass-v2 border-white/5 rounded-3xl p-4">
              <div className="flex items-center justify-between mb-4 px-2">
                 <h2 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Variants</h2>
                 <button className="p-1 rounded-lg bg-white/5 text-amber-400 hover:bg-white/10 transition-all">
                    <Plus className="h-4 w-4" />
                 </button>
              </div>
              <div className="space-y-2">
                 {variants.map((v) => (
                    <button 
                      key={v.id}
                      onClick={() => setSelectedVariant(v.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                        selectedVariant === v.id ? "bg-amber-400/10 border-amber-400" : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                         <div className={cn(
                           "h-1.5 w-1.5 rounded-full",
                           v.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-gray-700"
                         )} />
                         <span className={cn("text-xs font-bold uppercase tracking-tight", selectedVariant === v.id ? "text-amber-400" : "text-gray-400")}>
                           {v.label}
                         </span>
                      </div>
                      <ChevronRight className={cn("h-4 w-4 text-gray-700", selectedVariant === v.id && "text-amber-400 rotate-90")} />
                    </button>
                 ))}
              </div>
           </div>

           <div className="glass-v2 border-white/5 rounded-3xl p-6 bg-gradient-to-br from-amber-400/5 to-transparent">
              <div className="flex items-center gap-3 mb-4">
                 <Wand2 className="h-5 w-5 text-amber-400" />
                 <h3 className="text-xs font-bold text-white uppercase tracking-widest">AI Refiner</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-6 italic">
                "Create a more engaging, real-world application variant for lower engagement cohorts."
              </p>
              <button className="w-full py-3 rounded-xl bg-white/10 border border-white/5 text-xs font-bold text-white hover:bg-white/20 transition-all uppercase tracking-widest">
                Generate Variation
              </button>
           </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
           <AnimatePresence mode="wait">
             {variants.filter(v => v.id === selectedVariant).map(v => (
                <motion.div 
                  key={v.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-v2 border-white/5 rounded-[2rem] p-8 min-h-[500px] flex flex-col"
                >
                   <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                      <div className="flex items-center gap-6">
                         <div>
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Variant Name</p>
                            <input 
                              type="text" 
                              value={v.label} 
                              className="bg-transparent border-none text-xl font-bold text-white uppercase italic focus:outline-none focus:text-amber-400 transition-all" 
                            />
                         </div>
                         <div className="h-10 w-px bg-white/5" />
                         <div>
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Status</p>
                            <label className="flex items-center gap-2 cursor-pointer group">
                               <input type="checkbox" checked={v.isActive} className="hidden" />
                               <div className={cn("h-5 w-10 rounded-full border border-white/10 relative transition-all", v.isActive ? "bg-emerald-500" : "bg-white/5")}>
                                  <div className={cn("absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all", v.isActive ? "left-5.5" : "left-1")} />
                               </div>
                               <span className="text-[10px] font-bold text-white uppercase">{v.isActive ? 'Active' : 'Draft'}</span>
                            </label>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <button className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all">
                            <Layers className="h-5 w-5" />
                         </button>
                         <button className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all">
                            <Trash2 className="h-5 w-5" />
                         </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-6 mb-8">
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                         <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Difficulty</p>
                         <select className="w-full bg-transparent text-xs font-bold text-white uppercase italic focus:outline-none">
                            <option>Easy</option>
                            <option selected={v.difficulty === 'medium'}>Medium</option>
                            <option>Hard</option>
                         </select>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                         <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Language Tone</p>
                         <input type="text" value={v.tone} className="w-full bg-transparent text-xs font-bold text-white uppercase italic focus:outline-none" />
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                         <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Cohort Mapping</p>
                         <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                            {["ESL", "Top 10%", "At-Risk"].map(t => (
                               <span key={t} className="px-2 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-[8px] font-bold text-amber-400 uppercase tracking-tight whitespace-nowrap">
                                  {t}
                               </span>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="flex-1 flex flex-col min-h-[300px] rounded-3xl bg-black/40 border border-white/5 overflow-hidden">
                      <div className="px-6 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <button className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Content</button>
                            <button className="text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:text-white">Explanation</button>
                            <button className="text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:text-white">Hints</button>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="h-6 w-px bg-white/5 mr-2" />
                            <Settings2 className="h-4 w-4 text-gray-600" />
                         </div>
                      </div>
                      <textarea 
                        className="flex-1 w-full bg-transparent p-8 text-lg font-medium text-gray-300 leading-relaxed focus:outline-none resize-none"
                        value={v.content}
                        onChange={(e) => {
                           const newVariants = [...variants];
                           const idx = newVariants.findIndex(varnt => varnt.id === v.id);
                           newVariants[idx].content = e.target.value;
                           setVariants(newVariants);
                        }}
                      />
                   </div>

                   <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-gray-700 tracking-widest uppercase italic">
                      <div>Last saved: 12:45 PM by System</div>
                      <div className="flex items-center gap-4">
                         <span className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-emerald-500" /> Safe for deployment</span>
                         <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Auto-sync enabled</span>
                      </div>
                   </div>
                </motion.div>
             ))}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
