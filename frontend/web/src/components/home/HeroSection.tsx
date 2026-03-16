"use client";

import Link from "next/link";
import { MoveRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-950">
      {/* Background Neural Mesh */}
      <div className="absolute inset-0 neural-mesh opacity-10 pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-lumina-highlight/10 border border-lumina-highlight/20 mb-8 animate-fade-in shadow-xl">
            <span className="w-2 h-2 rounded-full bg-lumina-highlight animate-pulse" />
            <span className="text-sm font-black text-lumina-highlight uppercase tracking-[0.2em]">Lumina v2.0 Platform Live</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-white leading-[1.05] tracking-tight mb-8 font-display">
            Lumina <span className="text-lumina-highlight">AI</span> — The Platform That <span className="gradient-text-orange">Adapts to Every Student</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-400 mb-12 leading-relaxed max-w-3xl mx-auto font-sans">
            Teacher-verified AI tutoring, adaptive learning intelligence, and privacy-first design — built for the future of education.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-20">
            <Button size="lg" className="glass-button-highlight w-full sm:w-auto text-lg h-16 px-10 shadow-xl hover:shadow-lumina-highlight/20">
              Request Demo <MoveRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="glass-button-secondary w-full sm:w-auto text-lg h-16 px-10 backdrop-blur-xl border-white/10 hover:border-white/20">
              Explore Platform
            </Button>
          </div>

          {/* Trust Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto py-12 border-y border-white/5 bg-white/[0.02] rounded-3xl backdrop-blur-sm">
            {[
              "AI + Teacher Verified",
              "Privacy First",
              "Research Ready",
              "Institution Scale"
            ].map((badge) => (
              <div key={badge} className="flex flex-col items-center">
                <span className="text-xs font-bold text-lumina-highlight uppercase tracking-widest mb-2">{badge}</span>
                <div className="h-0.5 w-8 bg-lumina-highlight/30 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Product Preview Mockup */}
        <div className="mt-24 relative max-w-6xl mx-auto group">
          <div className="absolute -inset-4 bg-gradient-to-r from-lumina-highlight/20 via-amber-500/10 to-lumina-highlight/20 rounded-[2.5rem] blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-700" />
          <div className="relative glass-panel rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl aspect-video bg-surface-950">
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full bg-[#020617] relative overflow-hidden">
                   <div className="absolute inset-0 neural-mesh opacity-20" />
                   <div className="p-10 grid grid-cols-12 gap-8 h-full">
                      {/* Sidebar UI Simulation */}
                      <div className="col-span-2 space-y-6 pt-4 border-r border-white/5 pr-6 hidden lg:block">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-2 w-full bg-white/5 rounded-full" />)}
                      </div>
                      {/* Main UI Simulation */}
                      <div className="col-span-12 lg:col-span-10 space-y-10 pt-4">
                        <div className="flex justify-between items-center">
                           <div className="h-8 w-64 bg-white/10 rounded-xl" />
                           <div className="flex space-x-4">
                             <div className="h-10 w-32 bg-white/5 rounded-xl border border-white/10" />
                             <div className="h-10 w-10 bg-lumina-highlight/20 rounded-xl border border-lumina-highlight/30" />
                           </div>
                        </div>
                        <div className="grid grid-cols-3 gap-8">
                           {[1, 2, 3].map(i => (
                             <div key={i} className="h-40 glass-card border-white/5 hover:border-lumina-primary/20 bg-white/[0.02]" />
                           ))}
                        </div>
                        <div className="h-72 glass-card border-white/5 w-full flex items-center justify-center bg-white/[0.01]">
                           <div className="flex flex-col items-center space-y-6">
                              <div className="relative">
                                <div className="absolute inset-0 bg-lumina-primary/20 blur-2xl animate-pulse" />
                                <div className="h-1.5 w-80 bg-white/5 rounded-full overflow-hidden relative z-10">
                                   <div className="h-full w-2/3 bg-gradient-to-r from-lumina-primary to-lumina-accent animate-pulse" />
                                </div>
                              </div>
                              <span className="text-xs text-slate-500 uppercase tracking-[0.3em] font-bold">Neural Engine Synchronization: Active</span>
                           </div>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
      
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-lumina-highlight/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none translate-x-1/4 translate-y-1/4" />
    </section>
  );
}
