"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Laptop, Smartphone, Tablet } from "lucide-react";

const screens = [
  {
    title: "Neural Dashboard",
    description: "Comprehensive overview of student mastery across the whole curriculum.",
    type: "desktop"
  },
  {
    title: "AI Tutor Interface",
    description: "Real-time, context-aware support for students during study sessions.",
    type: "tablet"
  },
  {
    title: "Verification Queue",
    description: "Streamlined interface for teachers to audit AI interactions.",
    type: "desktop"
  },
  {
    title: "Parent Portal",
    description: "Insights into child's progress and focus areas on the go.",
    type: "mobile"
  }
];

export default function ProductCarousel() {
  const [active, setActive] = useState(0);

  return (
    <section id="product-screens" className="py-24 relative overflow-hidden bg-neutral-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 font-display">
            A Interface for <span className="gradient-text">Every Device</span>
          </h2>
          <p className="text-lg text-zinc-400 font-sans">
            Lumina's sleek, responsive design ensures a premium experience whether you're at a desktop or on the move.
          </p>
        </div>

        <div className="max-w-6xl mx-auto relative group">
          <div className="flex flex-col lg:flex-row items-center gap-12">
             <div className="flex-1 space-y-8">
               {screens.map((screen, i) => (
                 <div 
                   key={i} 
                   onClick={() => setActive(i)}
                   className={`p-6 cursor-pointer border-l-4 transition-all duration-300 ${active === i ? "border-lumina-primary bg-white/5" : "border-transparent hover:bg-white/[0.02]"}`}
                 >
                   <h3 className={`text-xl font-bold mb-2 font-display ${active === i ? "text-white" : "text-zinc-500"}`}>{screen.title}</h3>
                   <p className="text-sm text-zinc-400 font-sans">{screen.description}</p>
                 </div>
               ))}
             </div>

             <div className="flex-[2] w-full">
                <div className="relative glass-panel aspect-video rounded-3xl overflow-hidden border-white/10 bg-surface-950 shadow-2xl">
                   <div className="absolute inset-0 flex items-center justify-center p-8">
                      <div className="w-full h-full bg-[#020617] rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                         <div className="absolute inset-0 neural-mesh opacity-20" />
                         <div className="text-center space-y-4 relative z-10">
                            <div className="inline-block p-4 rounded-full bg-lumina-primary/20 mb-4 shadow-primary-glow">
                               {screens[active].type === "desktop" ? <Laptop className="h-12 w-12 text-lumina-primary" /> : screens[active].type === "tablet" ? <Tablet className="h-12 w-12 text-lumina-primary" /> : <Smartphone className="h-12 w-12 text-lumina-primary" />}
                            </div>
                            <h4 className="text-2xl font-black text-white font-display uppercase tracking-widest">{screens[active].title}</h4>
                            <p className="text-xs text-zinc-500 font-mono">Simulating Interface Build...</p>
                         </div>
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
