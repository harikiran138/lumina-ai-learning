"use client";

import { MoveRight, Mail, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-5xl bg-lumina-primary/10 rounded-full blur-[180px] opacity-30 pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="glass-panel max-w-5xl mx-auto rounded-[2rem] p-8 md:p-16 border border-white/10 relative overflow-hidden bg-surface-950/80">
          <div className="absolute top-0 right-0 w-64 h-64 bg-lumina-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-8 leading-tight">
              Transform Learning <br />
              <span className="gradient-text">with Lumina Today</span>
            </h2>
            <p className="text-lg text-gray-400 mb-12">
              Join the educational revolution. Empower your institution with privacy-first AI that understands every student.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Button size="lg" className="glass-button w-full sm:w-auto text-lg h-14 px-10">
                Request Demo <MoveRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="glass-button-secondary w-full sm:w-auto text-lg h-14 px-10">
                Contact Sales
              </Button>
            </div>
            
            <div className="mt-16 pt-8 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-8">
               <div className="flex flex-col items-center">
                  <Mail className="h-5 w-5 text-gray-500 mb-3" />
                  <span className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">Email us</span>
                  <span className="text-sm font-medium text-white">hello@lumina.ai</span>
               </div>
               <div className="flex flex-col items-center">
                  <Phone className="h-5 w-5 text-gray-500 mb-3" />
                  <span className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">Call sales</span>
                  <span className="text-sm font-medium text-white">+1 (555) LUMINA</span>
               </div>
               <div className="flex flex-col items-center">
                  <Calendar className="h-5 w-5 text-gray-500 mb-3" />
                  <span className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">Start Pilot</span>
                  <span className="text-sm font-medium text-white">Q3 2026 Cohort</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
