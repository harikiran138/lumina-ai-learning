"use client";

import { useState } from "react";
import { 
  GitMerge, 
  GitBranch, 
  Lock, 
  Unlock, 
  BookOpen, 
  CheckCircle,
  AlertCircle,
  Layers,
  Search,
  Settings2,
  Share2,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ConceptNode {
  id: string;
  label: string;
  type: "module" | "concept" | "assessment";
  status: "completed" | "in-progress" | "locked" | "needs-attention";
  dependencies: string[];
  mastery: number;
}

export default function CurriculumMapPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const nodes: ConceptNode[] = [
    { id: "m1", label: "Foundations of Web", type: "module", status: "completed", dependencies: [], mastery: 92 },
    { id: "c1", label: "HTML5 Semantics", type: "concept", status: "completed", dependencies: ["m1"], mastery: 95 },
    { id: "c2", label: "CSS Flexbox & Grid", type: "concept", status: "completed", dependencies: ["m1"], mastery: 88 },
    { id: "m2", label: "Javascript Core", type: "module", status: "in-progress", dependencies: ["m1"], mastery: 65 },
    { id: "c3", label: "Async Control Flow", type: "concept", status: "needs-attention", dependencies: ["m2"], mastery: 42 },
    { id: "c4", label: "Memory Management", type: "concept", status: "locked", dependencies: ["m2"], mastery: 0 },
    { id: "a1", label: "Unit 1 Assessment", type: "assessment", status: "locked", dependencies: ["c3", "c4"], mastery: 0 },
  ];

  return (
    <div className="min-h-screen space-y-8 p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight italic uppercase">Curriculum Map</h1>
          <p className="mt-2 text-gray-400">Visualizing learning paths and dependency constraints.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-all">
            <Share2 className="h-4 w-4" />
            Share Path
          </button>
           <button className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-black hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            <Plus className="h-4 w-4" />
            New Module
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 glass-v2 rounded-3xl border-white/5 p-8 min-h-[600px] relative overflow-hidden bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.03)_0%,transparent_100%)]">
           <div className="absolute top-8 left-8 flex items-center gap-4 z-10">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/40 border border-white/10 backdrop-blur-sm">
                 <Search className="h-4 w-4 text-gray-500" />
                 <input type="text" placeholder="Find concept..." className="bg-transparent border-none text-xs text-white focus:outline-none w-32" />
              </div>
              <button className="p-2 rounded-xl bg-black/40 border border-white/10 text-gray-400 hover:text-white backdrop-blur-sm">
                <Settings2 className="h-4 w-4" />
              </button>
           </div>

           {/* Visual Map Rendering (Simulated with Grid) */}
           <div className="mt-16 grid grid-cols-3 gap-12 relative">
             {/* Lines would be drawn here with SVGs in a real implementation */}
             {nodes.map((node) => (
                <motion.div
                  key={node.id}
                  layoutId={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    "cursor-pointer group relative p-6 rounded-2xl border transition-all duration-500",
                    selectedNode === node.id ? "bg-amber-400/10 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.1)]" : "bg-white/[0.02] border-white/10",
                    node.status === "locked" && "opacity-50 grayscale"
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      node.type === "module" ? "bg-blue-500/20 text-blue-400" :
                      node.type === "concept" ? "bg-amber-500/20 text-amber-400" :
                      "bg-purple-500/20 text-purple-400"
                    )}>
                      {node.type === "module" ? <Layers className="h-5 w-5" /> :
                       node.type === "concept" ? <BookOpen className="h-5 w-5" /> :
                       <Zap className="h-5 w-5" />}
                    </div>
                    {node.status === "completed" ? <CheckCircle className="h-4 w-4 text-emerald-500" /> :
                     node.status === "needs-attention" ? <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" /> :
                     node.status === "locked" ? <Lock className="h-4 w-4 text-gray-600" /> :
                     <Activity className="h-4 w-4 text-blue-500" />}
                  </div>

                  <h3 className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-amber-400 transition-colors">
                    {node.label}
                  </h3>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Mastery</div>
                    <div className="text-[10px] font-bold text-white italic">{node.mastery}%</div>
                  </div>
                  <div className="mt-1.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${node.mastery}%` }} />
                  </div>

                  {node.dependencies.length > 0 && (
                     <div className="absolute -top-3 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/80 border border-white/10 text-[8px] font-bold text-gray-500">
                        <GitBranch className="h-2.5 w-2.5" />
                        {node.dependencies.length} DEPS
                     </div>
                  )}
                </motion.div>
             ))}
           </div>
        </div>

        <div className="space-y-6">
           <AnimatePresence mode="wait">
             {selectedNode ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-v2 border-white/5 rounded-3xl p-6 h-full"
                >
                  <h2 className="text-xl font-bold text-white uppercase italic tracking-tight mb-6">Node Details</h2>
                  
                  {nodes.filter(n => n.id === selectedNode).map(node => (
                    <div key={node.id} className="space-y-6">
                       <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Selected Concept</p>
                          <p className="text-lg font-bold text-white">{node.label}</p>
                       </div>

                       <div className="space-y-4 text-sm font-medium text-gray-400">
                          <div className="flex justify-between items-center py-3 border-b border-white/5">
                             <span>Type</span>
                             <span className="text-amber-400 uppercase text-xs font-bold">{node.type}</span>
                          </div>
                          <div className="flex justify-between items-center py-3 border-b border-white/5">
                             <span>Status</span>
                             <span className="text-white uppercase text-xs font-bold">{node.status}</span>
                          </div>
                          <div className="flex justify-between items-center py-3 border-b border-white/5">
                             <span>Difficulty</span>
                             <span className="text-white uppercase text-xs font-bold">Hard</span>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Prerequisites</p>
                          <div className="flex flex-wrap gap-2">
                             {node.dependencies.map(dep => (
                                <div key={dep} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase italic">
                                   {dep}
                                </div>
                             ))}
                             {node.dependencies.length === 0 && <span className="text-xs italic text-gray-600">None</span>}
                          </div>
                       </div>

                       <div className="pt-4 space-y-3">
                          <button className="w-full py-3 rounded-xl bg-amber-400 text-black font-bold text-xs uppercase hover:bg-amber-300 transition-all">
                             Edit Content
                          </button>
                          <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase hover:bg-white/10 transition-all">
                             View Analytics
                          </button>
                       </div>
                    </div>
                  ))}
                </motion.div>
             ) : (
                <div className="glass-v2 border-white/5 rounded-3xl p-8 h-full flex flex-col items-center justify-center text-center">
                   <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                      <Layers className="h-8 w-8 text-gray-600" />
                   </div>
                   <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-2">Select a Node</h3>
                   <p className="text-sm text-gray-500">Tap on any module or concept in the map to view detailed metadata and dependency rules.</p>
                </div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
