"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

const screenshots = [
  {
    title: "Student Dashboard",
    description: "Personalized learning pathways with real-time progress tracking.",
    bgColor: "bg-surface-950"
  },
  {
    title: "AI Tutor Conversation",
    description: "Adaptive dialogue system that understands student misconceptions.",
    bgColor: "bg-surface-900"
  },
  {
    title: "Teacher Verification Queue",
    description: "Human-in-the-loop interface for content audit and approval.",
    bgColor: "bg-surface-800"
  },
  {
    title: "Institution Analytics",
    description: "Deep insights into learning outcomes across the entire campus.",
    bgColor: "bg-surface-950"
  },
  {
    title: "Parent Portal",
    description: "Restricted visibility into child progress and teacher messaging.",
    bgColor: "bg-surface-900"
  }
];

export default function ScreenshotsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const next = () => setActiveIndex((prev) => (prev + 1) % screenshots.length);
  const prev = () => setActiveIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Inside the Platform
          </h2>
          <p className="text-lg text-gray-400">
            Take a look at the premium, high-performance interfaces designed for maximum educational impact.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
           {/* Main Display */}
           <div className="glass-panel aspect-video rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl">
              <div className={cn("absolute inset-0 flex items-center justify-center transition-all duration-500", screenshots[activeIndex].bgColor)}>
                 <div className="w-full h-full relative p-4 lg:p-12 overflow-hidden">
                    <div className="absolute inset-0 neural-mesh opacity-20" />
                    
                    {/* Simulated UI Content */}
                    <div className="h-full w-full flex flex-col space-y-6">
                       <div className="flex justify-between items-center pb-4 border-b border-white/5">
                          <div className="h-4 w-32 bg-white/10 rounded-full" />
                          <div className="flex space-x-2">
                             {[1, 2, 3].map(i => <div key={i} className="h-6 w-12 bg-white/5 rounded-md" />)}
                          </div>
                       </div>
                       <div className="flex-1 grid grid-cols-12 gap-6">
                          <div className="col-span-3 space-y-4">
                             {[1, 2, 3, 4].map(i => <div key={i} className="h-2 w-full bg-white/5 rounded-full" />)}
                          </div>
                          <div className="col-span-9 glass-card border-white/5 p-8 flex items-center justify-center">
                             <div className="text-center">
                                <Maximize2 className="h-12 w-12 text-lumina-primary/20 mx-auto mb-4" />
                                <h4 className="text-xl font-bold text-white mb-2">{screenshots[activeIndex].title} Preview</h4>
                                <p className="text-sm text-gray-500 max-w-xs">{screenshots[activeIndex].description}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
              
              {/* Overlay shadow for text legibility if needed */}
              <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                 <h3 className="text-2xl font-bold text-white mb-2">{screenshots[activeIndex].title}</h3>
                 <p className="text-gray-300 max-w-xl">{screenshots[activeIndex].description}</p>
              </div>
           </div>
           
           {/* Navigation Buttons */}
           <div className="absolute top-1/2 -left-4 lg:-left-12 -translate-y-1/2 z-20">
              <button onClick={prev} className="w-12 h-12 rounded-full glass-v2 flex items-center justify-center hover:bg-white/10 transition-colors">
                 <ChevronLeft className="h-6 w-6 text-white" />
              </button>
           </div>
           <div className="absolute top-1/2 -right-4 lg:-right-12 -translate-y-1/2 z-20">
              <button onClick={next} className="w-12 h-12 rounded-full glass-v2 flex items-center justify-center hover:bg-white/10 transition-colors">
                 <ChevronRight className="h-6 w-6 text-white" />
              </button>
           </div>
           
           {/* Progress Dots */}
           <div className="flex justify-center mt-8 space-x-3">
              {screenshots.map((_, index) => (
                <button 
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    activeIndex === index ? "w-8 bg-lumina-primary" : "bg-white/20 hover:bg-white/40"
                  )}
                />
              ))}
           </div>
        </div>
      </div>
    </section>
  );
}
