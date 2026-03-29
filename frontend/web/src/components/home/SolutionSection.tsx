"use client";

import { 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Users2, 
  Brain, 
  UserCheck, 
  FileText, 
  BarChart4 
} from "lucide-react";

const solutions = [
  {
    icon: Brain,
    title: "AI Neural Tutor",
    description: "24/7 personalized AI support that maps and understands each student's unique knowledge graph and learning velocity."
  },
  {
    icon: Zap,
    title: "Adaptive Mastery Engine",
    description: "Deep Knowledge Tracing (DKT) and BKT models that dynamically adjust curriculum complexity in real-time."
  },
  {
    icon: UserCheck,
    title: "Educator Integrity System",
    description: "A unique high-trust system ensuring all AI-generated content is accurate, ethical, and educator-verified."
  },
  {
    icon: FileText,
    title: "Analog-Digital Bridge",
    description: "Fusing physical and digital learning with AI-assisted grading of handwritten assignments and complex paper exams."
  },
  {
    icon: BarChart4,
    title: "Predictive Analytics",
    description: "Deep insights into student mastery and dropout risks with privacy-first, institutional-grade data security."
  },
  {
    icon: Users2,
    title: "Unified Ecosystem",
    description: "Seamless synchronization between students, faculty, and administration within a single cohesive platform."
  }
];

export default function SolutionSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-24 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-150">
          <div className="inline-block px-4 py-1.5 rounded-full bg-lumina-highlight/10 border border-lumina-highlight/20 text-lumina-highlight text-xs font-black uppercase tracking-[0.2em] mb-6">
            The Solution
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-8 font-display tracking-tight leading-[0.9]">
            The <span className="text-lumina-highlight">Intelligent</span> Architecture
          </h2>
          <p className="text-xl text-slate-400 font-sans max-w-2xl mx-auto leading-relaxed">
            Lumina bridges the gap between raw AI potential and pedagogical integrity through six robust architectural pillars.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((solution, index) => (
            <div key={index} className="glass-v2-gold p-10 group flex flex-col items-start transition-all duration-500 hover:bg-white/[0.02] hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-lumina-highlight/10 flex items-center justify-center mb-8 group-hover:bg-lumina-highlight/20 transition-all duration-300 shadow-[0_0_20px_rgba(250,204,21,0.05)]">
                <solution.icon className="h-7 w-7 text-lumina-highlight" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4 group-hover:text-lumina-highlight transition-colors font-display tracking-tight">
                {solution.title}
              </h3>
              <p className="text-slate-400 leading-relaxed font-sans text-lg">
                {solution.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Decorative center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl max-h-4xl bg-lumina-highlight/[0.03] rounded-full blur-[180px] pointer-events-none" />
      
      {/* Animated subtle lights */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-lumina-highlight/5 blur-[120px] animate-pulse pointer-events-none" />
    </section>
  );
}
