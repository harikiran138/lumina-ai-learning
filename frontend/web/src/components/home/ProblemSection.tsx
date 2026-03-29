"use client";

import { AlertCircle, Clock, BarChart3, Users, BookOpen, Zap } from "lucide-react";

const problems = [
  {
    icon: BookOpen,
    title: "Static Learning Systems",
    description: "❌ One-size-fits-all learning. Students learn differently but legacy LMS systems treat them all the same."
  },
  {
    icon: Clock,
    title: "Teacher Workload",
    description: "Educators are overwhelmed with administrative tasks, leaving less time for high-impact 1-on-1 teaching."
  },
  {
    icon: Zap,
    title: "Low Student Engagement",
    description: "Static content and lack of interaction lead to disengagement and lower mastery of complex concepts."
  },
  {
    icon: AlertCircle,
    title: "No Personalization",
    description: "Without real-time feedback and adaptive pathways, students struggle to catch up or move ahead at their own pace."
  }
];

export default function ProblemSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-black">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-lumina-highlight/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-5 duration-1000">
          <div className="inline-block px-4 py-1.5 rounded-full bg-lumina-highlight/10 border border-lumina-highlight/20 text-lumina-highlight text-xs font-black uppercase tracking-[0.2em] mb-6">
            The Context
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-8 font-display tracking-tight leading-[0.9]">
             Legacy Limitations <br />
             <span className="text-lumina-highlight">Modern Solutions</span>
          </h2>
          <p className="text-xl text-slate-400 font-sans leading-relaxed max-w-2xl mx-auto">
            Traditional systems were built for administrative convenience, not student mastery. Lumina architecturally dismantles these barriers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {problems.map((problem, index) => (
            <div key={index} className="glass-v2-gold p-10 group relative overflow-hidden transition-all duration-500 hover:-translate-y-1">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <problem.icon className="h-24 w-24 text-lumina-highlight" />
              </div>
              <div className="w-16 h-16 rounded-2xl bg-lumina-highlight/10 flex items-center justify-center mb-8 group-hover:bg-lumina-highlight/20 transition-all duration-500 shadow-[0_0_20px_rgba(250,204,21,0.1)]">
                <problem.icon className="h-8 w-8 text-lumina-highlight" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4 font-display tracking-tight">{problem.title}</h3>
              <p className="text-slate-400 leading-relaxed font-sans text-lg">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
