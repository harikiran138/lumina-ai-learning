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
    <section className="py-24 relative overflow-hidden bg-surface-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 font-display">
             The Problem with <span className="text-lumina-highlight">Traditional Education</span>
          </h2>
          <p className="text-lg text-slate-400 font-sans">
            Legacy systems were built for administrative convenience, not student mastery. Lumina solves the core limitations of traditional educational technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {problems.map((problem, index) => (
            <div key={index} className="glass-v2 p-8 group border-white/5 hover:border-lumina-highlight/20">
              <div className="w-14 h-14 rounded-2xl bg-lumina-highlight/10 flex items-center justify-center mb-6 group-hover:bg-lumina-highlight/20 transition-all duration-500">
                <problem.icon className="h-7 w-7 text-lumina-highlight" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 font-display">{problem.title}</h3>
              <p className="text-slate-400 leading-relaxed font-sans">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
