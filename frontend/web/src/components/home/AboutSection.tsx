"use client";

import { Info, Target, Users } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Our Mission: <span className="gradient-text">Human-Centric AI</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              Lumina was founded on the belief that AI should empower educators, not replace them. We build tools that bridge the gap between advanced technology and pedagogical integrity.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-lg bg-lumina-primary/10 flex items-center justify-center shrink-0">
                  <Target className="h-5 w-5 text-lumina-primary" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Adaptive Excellence</h4>
                  <p className="text-sm text-gray-500">Continuous innovation in BKT/DKT modeling to ensure every student finds their unique path to mastery.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-lg bg-lumina-primary/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-lumina-primary" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Privacy Sovereignty</h4>
                  <p className="text-sm text-gray-500">A commitment to zero-knowledge architecture where institutions retain 100% control of their data.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="glass-v2 p-1 relative z-10 rounded-2xl overflow-hidden aspect-video flex items-center justify-center bg-surface-900">
               <div className="text-center p-8">
                 <div className="inline-block p-4 rounded-full bg-lumina-primary/10 mb-4">
                   <Info className="h-8 w-8 text-lumina-primary" />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">Developed by Nadimpalli Informatics</h3>
                 <p className="text-sm text-gray-400">Pioneering the next generation of privacy-first educational technology.</p>
               </div>
            </div>
            {/* Decorative background pulse */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-lumina-primary/20 rounded-full blur-[80px] animate-pulse-slow" />
          </div>
        </div>
      </div>
    </section>
  );
}
