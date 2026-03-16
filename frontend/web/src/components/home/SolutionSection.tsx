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
    title: "AI Tutor",
    description: "24/7 personalized AI support that understands each student's unique knowledge graph and learning pace."
  },
  {
    icon: Zap,
    title: "Adaptive Learning Engine",
    description: "Deep Knowledge Tracing (DKT) and BKT models that adjust curriculum difficulty in real-time."
  },
  {
    icon: UserCheck,
    title: "Teacher Verification System",
    description: "A unique human-in-the-loop system ensuring all AI-generated content is accurate and educator-approved."
  },
  {
    icon: FileText,
    title: "Real Paper Assignments",
    description: "Bridge the digital-physical gap with AI-assisted grading of handwritten assignments and paper exams."
  },
  {
    icon: BarChart4,
    title: "Learning Analytics",
    description: "Deep insights into student mastery, engagement, and dropout prediction with privacy-safe data."
  },
  {
    icon: Users2,
    title: "Multi-Role Collaboration",
    description: "Seamless coordination between students, teachers, parents, and admins within a unified ecosystem."
  }
];

export default function SolutionSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 font-display leading-tight">
            The <span className="text-lumina-highlight">Intelligent</span> Solution
          </h2>
          <p className="text-xl text-slate-400 font-sans max-w-2xl mx-auto">
            Lumina bridges the gap between raw AI power and pedagogical integrity with six core architectural pillars.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((solution, index) => (
            <div key={index} className="glass-v2-gold p-8 group">
              <div className="w-12 h-12 rounded-xl bg-lumina-highlight/10 flex items-center justify-center mb-6 group-hover:bg-lumina-highlight/20 transition-colors">
                <solution.icon className="h-6 w-6 text-lumina-highlight" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-lumina-highlight transition-colors">
                {solution.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {solution.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl max-h-4xl bg-lumina-highlight/5 rounded-full blur-[180px] pointer-events-none" />
    </section>
  );
}
