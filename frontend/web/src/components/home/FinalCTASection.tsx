"use client";

import { MoveRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FinalCTASection() {
  return (
    <section id="cta" className="py-24 relative overflow-hidden bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="glass-panel p-12 lg:p-24 relative overflow-hidden group border-white/10 shadow-primary-glow">
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-lumina-primary to-transparent" />
            
            <div className="relative z-10 text-center space-y-8">
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-lumina-primary/10 border border-lumina-primary/20 mb-4">
                 <Zap className="h-4 w-4 text-lumina-primary" />
                 <span className="text-xs font-bold text-lumina-primary uppercase tracking-widest">Start the Revolution</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight font-display">
                Ready to Build the <br />
                <span className="gradient-text">Future of Education?</span>
              </h2>
              
              <p className="text-xl text-slate-400 font-sans max-w-2xl mx-auto leading-relaxed">
                Join hundreds of institutions using Lumina to personalize learning, empower teachers, and protect student privacy.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 pt-8">
                 <Button size="lg" className="glass-button-highlight w-full sm:w-auto text-lg h-16 px-12 shadow-xl hover:shadow-lumina-highlight/20">
                    Request Integration <MoveRight className="ml-2 h-5 w-5" />
                 </Button>
                 <Button variant="outline" size="lg" className="glass-button-secondary w-full sm:w-auto text-lg h-16 px-12 backdrop-blur-xl border-white/10 hover:border-white/20">
                    Contact Sales
                 </Button>
              </div>
            </div>

            {/* Background neural mesh */}
            <div className="absolute inset-0 neural-mesh opacity-[0.05] group-hover:opacity-[0.08] transition-opacity" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-lumina-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-lumina-accent/20 rounded-full blur-[120px] pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
