"use client";

import { Brain, Network, LineChart, Target, Repeat } from "lucide-react";

const engineFeatures = [
  {
    icon: Network,
    title: "Knowledge Graph Modeling",
    description: "Multi-parameter knowledge graphs that map relationships between learning objectives and content nodes."
  },
  {
    icon: Target,
    title: "BKT Mastery Tracking",
    description: "Bayesian Knowledge Tracing ensures students mastery of concepts before advancing to the next level."
  },
  {
    icon: Brain,
    title: "DKT Deep Modeling",
    description: "Deep Knowledge Tracing uses neural networks to predict future student performance and performance gaps."
  },
  {
    icon: Repeat,
    title: "Reinforcement Learning",
    description: "The system learns from student interactions to continuously optimize instruction delivery styles."
  },
  {
    icon: LineChart,
    title: "Dynamic Pathways",
    description: "Real-time recalculation of student journeys based on every micro-interaction and sentiment analysis."
  }
];

export default function EngineSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8">
              The AI Learning Engine
            </h2>
            <div className="space-y-8">
              {engineFeatures.map((feature, index) => (
                <div key={index} className="flex space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-lumina-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-lumina-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
             <div className="absolute -inset-4 bg-lumina-primary/10 rounded-3xl blur-2xl opacity-30" />
             <div className="relative glass-panel rounded-3xl border border-white/10 aspect-square flex items-center justify-center p-8 bg-surface-950/50">
                <div className="w-full h-full relative">
                   {/* Animated Brain/Network Visual Placeholder */}
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 rounded-full border border-lumina-primary/20 flex items-center justify-center animate-pulse">
                         <div className="w-32 h-32 rounded-full border border-lumina-primary/40 flex items-center justify-center">
                            <Brain className="h-16 w-16 text-lumina-primary animate-bounce" />
                         </div>
                      </div>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-lumina-primary rounded-full blur-sm" />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-lumina-accent rounded-full blur-sm" />
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-500 rounded-full blur-sm" />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-500 rounded-full blur-sm" />
                   </div>
                   <div className="absolute inset-0 neural-mesh opacity-50" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
