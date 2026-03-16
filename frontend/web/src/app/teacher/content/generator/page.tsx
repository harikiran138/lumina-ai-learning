"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Presentation, 
  FileText, 
  Download, 
  Settings2, 
  Sparkles, 
  Layout, 
  Palette, 
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  PlusCircle,
  Clock
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ContentGeneratorPage() {
  const [format, setFormat] = useState<"ppt" | "pdf">("ppt");
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["Asynchronous JS", "Event Loop"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const topics = [
    "Introduction to JS",
    "Scope & Closures",
    "Asynchronous JS",
    "Event Loop",
    "Promises & Async/Await",
    "DOM Manipulation",
    "Browser APIs"
  ];

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const startGeneration = () => {
    setIsGenerating(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 5;
      });
    }, 200);
  };

  return (
    <div className="min-h-screen space-y-8 p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link 
            href="/teacher/content"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Content
          </Link>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Asset Generator
          </h1>
          <p className="mt-2 text-gray-400 max-w-2xl">
            AI-driven presentation and document synthesis. Choose your topics, set your tone, and let Lumina build your classroom materials.
          </p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <div className="space-y-8">
          <section className="glass-v2 border-white/5 p-8 rounded-3xl">
            <h3 className="text-xl font-bold text-white mb-6">1. Select Target Topics</h3>
            <div className="flex flex-wrap gap-3">
              {topics.map(topic => (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                    selectedTopics.includes(topic)
                      ? "bg-amber-400 text-black border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                      : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20 hover:text-white"
                  )}
                >
                  {topic}
                </button>
              ))}
              <button className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 text-gray-500 border border-dashed border-white/10 hover:border-amber-400/30 hover:text-amber-400 transition-all flex items-center gap-2">
                <PlusCircle className="h-3 w-3" />
                Add Custom Topic
              </button>
            </div>
          </section>

          <section className="glass-v2 border-white/5 p-8 rounded-3xl">
            <h3 className="text-xl font-bold text-white mb-6">2. Output Configuration</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div 
                onClick={() => setFormat("ppt")}
                className={cn(
                  "p-6 rounded-2xl border-2 transition-all cursor-pointer group",
                  format === "ppt" ? "border-amber-400 bg-amber-400/5" : "border-white/5 bg-white/[0.02] hover:border-white/10"
                )}
              >
                <Presentation className={cn("h-8 w-8 mb-4 transition-colors", format === "ppt" ? "text-amber-400" : "text-gray-500")} />
                <h4 className="font-bold text-white">PowerPoint Slides</h4>
                <p className="text-xs text-gray-500 mt-1">Structured slides with speaker notes and focus points.</p>
              </div>
              <div 
                onClick={() => setFormat("pdf")}
                className={cn(
                  "p-6 rounded-2xl border-2 transition-all cursor-pointer group",
                  format === "pdf" ? "border-amber-400 bg-amber-400/5" : "border-white/5 bg-white/[0.02] hover:border-white/10"
                )}
              >
                <FileText className={cn("h-8 w-8 mb-4 transition-colors", format === "pdf" ? "text-amber-400" : "text-gray-500")} />
                <h4 className="font-bold text-white">Revision Guide (PDF)</h4>
                <p className="text-xs text-gray-500 mt-1">Dense summary of concepts, definitions, and examples.</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 flex items-center gap-1">
                  <Palette className="h-3 w-3" />
                  Visual Theme
                </p>
                <select className="w-full rounded-xl bg-white/5 border border-white/10 p-2 text-xs text-white focus:outline-none">
                  <option>Minimalist Dark</option>
                  <option>Corporate Light</option>
                  <option>Academic Classic</option>
                </select>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 flex items-center gap-1">
                  <Layout className="h-3 w-3" />
                  Complexity
                </p>
                <select className="w-full rounded-xl bg-white/5 border border-white/10 p-2 text-xs text-white focus:outline-none">
                  <option>Beginner (High-level)</option>
                  <option>Intermediate (Detailed)</option>
                  <option>Expert (Deep-dive)</option>
                </select>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 flex items-center gap-1">
                  <Settings2 className="h-3 w-3" />
                  Interaction
                </p>
                <select className="w-full rounded-xl bg-white/5 border border-white/10 p-2 text-xs text-white focus:outline-none">
                  <option>Standard Lecture</option>
                  <option>Workshop / Demo</option>
                  <option>Q&A Focused</option>
                </select>
              </div>
            </div>
          </section>

          {!isGenerating ? (
            <button 
              onClick={startGeneration}
              disabled={selectedTopics.length === 0}
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-amber-400 px-8 py-4 font-bold text-black hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_40px_rgba(251,191,36,0.2)]"
            >
              <Sparkles className="h-5 w-5" />
              Generate {format.toUpperCase()} Package
            </button>
          ) : (
            <div className="glass-v2 border-white/5 p-8 rounded-3xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-amber-400 animate-spin" />
                  <span className="text-white font-bold">Lumina is synthesizing your assets...</span>
                </div>
                <span className="text-amber-400 font-bold">{progress}%</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-amber-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center italic">"Analyzing Event Loop visuals and drafting speaker notes..."</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className="glass-v2 border-white/5 p-8 rounded-3xl">
            <h3 className="text-xl font-bold text-white mb-6">Recent Assets</h3>
            <div className="space-y-4">
              {[
                { name: "Unit 2: Basics.pptx", date: "2 days ago", type: "ppt" },
                { name: "Closures Guide.pdf", date: "1 week ago", type: "pdf" }
              ].map((asset, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer p-2 -m-2 rounded-xl hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center",
                      asset.type === "ppt" ? "bg-amber-400/10 text-amber-400" : "bg-amber-400/10 text-amber-400"
                    )}>
                      {asset.type === "ppt" ? <Presentation className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{asset.name}</p>
                      <p className="text-[10px] text-gray-600 font-bold uppercase">{asset.date}</p>
                    </div>
                  </div>
                  <Download className="h-4 w-4 text-gray-600 group-hover:text-white transition-colors" />
                </div>
              ))}
            </div>
          </section>

          <div className="p-6 rounded-3xl bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-yellow-400 shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-bold text-yellow-100">Live Preview Ready</p>
                <p className="text-xs text-yellow-200/60 leading-relaxed">
                  Lumina generates high-fidelity previews. You can edit individual slides directly in the generated output before downloading.
                </p>
              </div>
            </div>
          </div>

          <section className="glass-v2 border-white/10 p-6 rounded-3xl flex items-center justify-between group cursor-pointer hover:bg-white/[0.02] transition-all border-dashed">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Scheduled Generation</p>
                <p className="text-xs text-gray-500">Auto-generate for next class</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-white transition-all transform group-hover:translate-x-1" />
          </section>
        </div>
      </div>
    </div>
  );
}
