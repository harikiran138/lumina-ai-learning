"use client";

import { Cpu, Database, Network, Sparkles, Workflow } from "lucide-react";

export default function AIEngineSection() {
  return (
    <section id="ai-engine" className="py-24 relative overflow-hidden bg-neutral-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 font-display">
            The Neural <span className="gradient-text">Learning Engine</span>
          </h2>
          <p className="text-lg text-zinc-400 font-sans">
            Lumina's proprietary AI architecture combines deep knowledge tracing with semantic modeling to create a truly adaptive learning experience.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="glass-v2-primary p-12 relative overflow-hidden group">
            <div className="absolute inset-0 neural-mesh opacity-10" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-lumina-primary/10 flex items-center justify-center shadow-primary-glow group-hover:scale-110 transition-transform duration-500">
                  <Database className="h-10 w-10 text-lumina-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-3 font-display">Knowledge Store</h3>
                  <p className="text-sm text-zinc-400 font-sans">Structured repository of curriculum material, verified answers, and research-backed pedagogical data.</p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-lumina-primary to-lumina-accent flex items-center justify-center shadow-2xl animate-pulse-slow">
                  <Cpu className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-3 font-display">Neural Inference</h3>
                  <p className="text-sm text-zinc-400 font-sans">Real-time adaptive logic that calculates the "Zone of Proximal Development" for every learner.</p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-lumina-accent/10 flex items-center justify-center shadow-accent-glow group-hover:scale-110 transition-transform duration-500">
                  <Network className="h-10 w-10 text-lumina-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-3 font-display">Mastery Graph</h3>
                  <p className="text-sm text-zinc-400 font-sans">Dynamic visualization of student progress, identifying gaps and suggesting optimal growth trajectories.</p>
                </div>
              </div>
            </div>

            {/* Connecting lines simulation */}
            <div className="hidden md:block absolute top-1/2 left-[25%] right-[25%] -translate-y-12 h-px bg-gradient-to-r from-transparent via-lumina-primary/30 to-transparent" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-lumina-primary/10 rounded-full blur-[100px] pointer-events-none" />
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-v2 p-6 flex items-start space-x-4">
              <div className="p-2 rounded-lg bg-lumina-primary/10">
                <Sparkles className="h-6 w-6 text-lumina-primary" />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1 font-display">Deep Knowledge Tracing</h4>
                <p className="text-xs text-zinc-500 font-sans">Advanced RNN-based models to predict student performance on future exercises.</p>
              </div>
            </div>
            <div className="glass-v2 p-6 flex items-start space-x-4">
              <div className="p-2 rounded-lg bg-lumina-accent/10">
                <Workflow className="h-6 w-6 text-lumina-accent" />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1 font-display">Semantic Pathway Logic</h4>
                <p className="text-xs text-zinc-500 font-sans">Graphs that connect disparate concepts, enabling cross-disciplinary learning insights.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
