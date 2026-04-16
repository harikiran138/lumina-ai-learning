"use client";

import { Microscope, BarChart4, PieChart, Activity, Download } from "lucide-react";

export default function ResearchSection() {
  return (
      <section id="research" className="py-24 relative overflow-hidden bg-surface">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
         <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 w-full relative">
                      <div className="glass-panel p-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-10">
                    <Microscope className="h-48 w-48 text-lumina-accent" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-8">
                       <div className="h-12 w-12 rounded-xl bg-lumina-accent/10 flex items-center justify-center">
                          <BarChart4 className="h-6 w-6 text-lumina-accent" />
                       </div>
                       <h4 className="text-xl font-bold text-white font-display">Growth Analytics</h4>
                    </div>
                    
                    <div className="space-y-6">
                                 <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                                    <div className="h-full w-3/4 bg-gradient-to-r from-primary to-accent animate-pulse" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-surface border border-border">
                             <span className="text-xs text-text-muted block mb-1 uppercase font-bold tracking-widest">Mastery Rate</span>
                             <span className="text-2xl font-black text-text font-display">+92%</span>
                          </div>
                          <div className="p-4 rounded-xl bg-surface border border-border">
                             <span className="text-xs text-text-muted block mb-1 uppercase font-bold tracking-widest">Efficiency</span>
                             <span className="text-2xl font-black text-lumina-accent font-display">4.2x</span>
                          </div>
                       </div>
                    </div>
                    
                    <button className="mt-8 flex items-center space-x-2 text-xs font-bold text-text-secondary hover:text-text transition-colors uppercase tracking-widest">
                       <Download className="h-4 w-4" />
                       <span>Download Research Case Study</span>
                    </button>
                  </div>
               </div>
            </div>

            <div className="flex-1 space-y-8">
               <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <Activity className="h-4 w-4 text-lumina-primary" />
                  <span className="text-xs font-bold text-lumina-primary uppercase tracking-widest">Data-Driven Excellence</span>
               </div>
               
               <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-text leading-tight font-display">
                 Research & <br />
                 <span className="text-lumina-primary">Growth Analytics</span>
               </h2>
               
               <p className="text-lg text-text-secondary font-sans">
                 Lumina provides institutional-scale analytics that help researchers and administrators understand the true impact of AI on learning outcomes.
               </p>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <h4 className="text-text font-bold font-display">Predictive Modeling</h4>
                     <p className="text-sm text-text-muted font-sans">Identify students at risk of falling behind before it happens.</p>
                  </div>
                  <div className="space-y-2">
                     <h4 className="text-text font-bold font-display">Impact Tracking</h4>
                     <p className="text-sm text-text-muted font-sans">Real-time dashboards for institutional ROI and student growth.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </section>
  );
}
