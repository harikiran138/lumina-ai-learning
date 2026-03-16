"use client";

import Link from "next/link";
import { MoveRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-lumina-primary animate-pulse" />
            <span className="text-sm font-medium text-gray-400">Lumina v2.0 is now live</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-8">
            Lumina — The AI Learning Platform That <br />
            <span className="gradient-text">Adapts to Every Student</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl mx-auto">
            A privacy-first, teacher-verified AI learning system that personalizes education for every learner through adaptive knowledge modeling.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Button size="lg" className="glass-button w-full sm:w-auto text-lg h-14 px-8">
              Request Demo <MoveRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="glass-button-secondary w-full sm:w-auto text-lg h-14 px-8">
              <PlayCircle className="mr-2 h-5 w-5" /> Explore Platform
            </Button>
          </div>
        </div>

        {/* Product Preview Mockup */}
        <div className="mt-20 relative max-w-6xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-lumina-primary/20 to-lumina-accent/20 rounded-2xl blur-xl opacity-50" />
          <div className="relative glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl aspect-video bg-surface-950">
             {/* We can use an image placeholder or an actual image if we had one. 
                 Since the user mentioned "Live Product Screenshots", 
                 I'll add a placeholder that looks like a dashboard. */}
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full bg-[#02040a] relative overflow-hidden">
                   <div className="absolute inset-0 neural-mesh opacity-30" />
                   <div className="p-8 grid grid-cols-12 gap-6 h-full">
                      {/* Sidebar UI Simulation */}
                      <div className="col-span-2 space-y-4 pt-4 border-r border-white/5 pr-4 hidden lg:block">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-2 w-full bg-white/5 rounded-full" />)}
                      </div>
                      {/* Main UI Simulation */}
                      <div className="col-span-12 lg:col-span-10 space-y-8 pt-4">
                        <div className="flex justify-between items-center">
                           <div className="h-8 w-48 bg-white/10 rounded-lg" />
                           <div className="h-10 w-10 bg-lumina-primary/20 rounded-full border border-lumina-primary/30" />
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                           {[1, 2, 3].map(i => (
                             <div key={i} className="h-32 glass-card border-white/5" />
                           ))}
                        </div>
                        <div className="h-64 glass-card border-white/5 w-full flex items-center justify-center">
                           <div className="flex flex-col items-center space-y-4">
                              <div className="h-1 w-64 bg-white/5 rounded-full overflow-hidden">
                                 <div className="h-full w-2/3 bg-lumina-primary animate-pulse" />
                              </div>
                              <span className="text-xs text-gray-500 uppercase tracking-widest">AI Learning Engine Active</span>
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
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-lumina-primary/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-lumina-accent/5 rounded-full blur-[150px] pointer-events-none translate-x-1/4 translate-y-1/4" />
    </section>
  );
}
