"use client";

import { Microscope, Database, FileText, TrendingUp, Info } from "lucide-react";

const impactAreas = [
  {
    icon: TrendingUp,
    title: "Learning Analytics",
    description: "Aggregate datasets for deep analysis of educational outcomes and curriculum effectiveness."
  },
  {
    icon: Database,
    title: "AI Impact Studies",
    description: "Measure the efficacy of AI-driven interventions across diverse demographic cohorts."
  },
  {
    icon: FileText,
    title: "Policy Insights",
    description: "Generate data-driven recommendations for institutional policy and educational governance."
  },
  {
    icon: Info,
    title: "Research Partnerships",
    description: "Collaborate with academic institutions using our privacy-safe data export protocols."
  }
];

export default function ImpactSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-surface-950/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-lumina-primary/10 flex items-center justify-center mb-8 shadow-gold-glow">
              <Microscope className="h-8 w-8 text-lumina-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Research & Impact
            </h2>
            <p className="text-lg text-gray-400 mb-10 leading-relaxed">
              Lumina isn't just a learning tool—it's a research laboratory. We empower researchers and institutions with high-integrity, anonymized data to push the boundaries of educational science.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {impactAreas.map((area, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <area.icon className="h-5 w-5 text-lumina-primary" />
                    <h3 className="font-bold text-white">{area.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {area.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
             <div className="absolute -inset-4 bg-lumina-primary/10 rounded-3xl blur-2xl opacity-20" />
             <div className="relative glass-panel rounded-3xl border border-white/5 p-8 bg-surface-950 overflow-hidden">
                <div className="absolute inset-0 neural-mesh opacity-10" />
                <div className="relative z-10 space-y-6">
                   <div className="flex justify-between items-center pb-4 border-b border-white/5">
                      <span className="text-xs font-mono text-lumina-primary tracking-widest uppercase">Research Dataset Alpha v4</span>
                      <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                   </div>
                   
                   <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="glass-card p-4 border-white/5 flex items-center justify-between">
                           <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                 <FileText className="h-4 w-4 text-gray-400" />
                              </div>
                              <span className="text-xs text-gray-300">Anonymized_Cohort_0{i}.json</span>
                           </div>
                           <span className="text-[10px] text-gray-500">2.4 MB</span>
                        </div>
                      ))}
                   </div>
                   
                   <div className="pt-4">
                      <div className="bg-white/5 rounded-xl h-32 flex flex-col items-center justify-center border border-dashed border-white/10 group hover:border-lumina-primary/30 transition-colors cursor-pointer">
                         <div className="w-10 h-10 rounded-full bg-lumina-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <TrendingUp className="h-4 w-4 text-lumina-primary" />
                         </div>
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Generate Impact Report</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
