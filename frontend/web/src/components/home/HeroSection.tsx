"use client";

import Link from "next/link";
import Image from "next/image";
import { MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-black">
      {/* Background Neural Mesh */}
      <div className="absolute inset-0 neural-mesh opacity-20 pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-lumina-highlight/10 border border-lumina-highlight/20 mb-8 animate-fade-in shadow-[0_0_30px_rgba(250,204,21,0.1)]">
            <span className="w-2 h-2 rounded-full bg-lumina-highlight animate-pulse" />
            <span className="text-sm font-black text-lumina-highlight uppercase tracking-[0.2em]">Lumina v2.0 Platform Live</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-white leading-[1.05] tracking-tight mb-8 font-display">
            Lumina <span className="text-lumina-highlight">AI</span> — The Platform That <span className="gradient-text-gold">Adapts to Every Student</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-400 mb-12 leading-relaxed max-w-3xl mx-auto font-sans">
            Teacher-verified AI tutoring, adaptive learning intelligence, and privacy-first design — built for the future of education.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-20">
            <Button size="lg" className="glass-button-highlight w-full sm:w-auto text-lg h-16 px-10 shadow-2xl">
              Request Demo <MoveRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="glass-button-secondary w-full sm:w-auto text-lg h-16 px-10 border-lumina-highlight/10">
              Explore Platform
            </Button>
          </div>

          {/* Trust Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto py-12 border-y border-lumina-highlight/5 bg-white/[0.01] rounded-3xl backdrop-blur-sm">
            {[
              "AI + Teacher Verified",
              "Privacy First",
              "Research Ready",
              "Institution Scale"
            ].map((badge) => (
              <div key={badge} className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-lumina-highlight uppercase tracking-[0.25em] mb-2">{badge}</span>
                <div className="h-0.5 w-8 bg-lumina-highlight/40 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Product Preview Mockup */}
        <div className="mt-24 relative max-w-6xl mx-auto group">
          <div className="absolute -inset-4 bg-gradient-to-r from-lumina-highlight/30 via-amber-500/20 to-lumina-highlight/30 rounded-[2.5rem] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
          <div className="relative glass-panel rounded-[2rem] border border-lumina-highlight/10 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] aspect-video">
             <div className="absolute inset-0 bg-surface-950">
                <div className="absolute inset-0 neural-mesh opacity-10" />
                <div className="relative w-full h-full flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-1000">
                  <Image 
                    src="/images/hero-yellow.png" 
                    alt="Lumina AI Engine"
                    fill
                    className="object-cover opacity-80"
                    priority
                  />
                  {/* Overlay Gradient for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-transparent to-transparent opacity-60" />
                  
                  {/* Floating Elements / UI Accents */}
                  <div className="absolute inset-0 p-12 flex flex-col justify-end">
                     <div className="glass-card p-6 max-w-md border-lumina-highlight/20 transform -translate-x-4 group-hover:translate-x-0 transition-transform duration-700">
                        <div className="flex items-center space-x-4 mb-3">
                           <div className="w-10 h-10 rounded-full bg-lumina-highlight/20 flex items-center justify-center border border-lumina-highlight/30">
                              <span className="text-lumina-highlight font-bold text-xs">AI</span>
                           </div>
                           <div className="space-y-1">
                              <div className="h-2 w-32 bg-white/20 rounded-full" />
                              <div className="h-2 w-24 bg-white/10 rounded-full" />
                           </div>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full w-3/4 bg-lumina-highlight animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                        </div>
                     </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
      
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-lumina-highlight/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none translate-x-1/4 translate-y-1/4" />
    </section>
  );
}
