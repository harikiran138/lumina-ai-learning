"use client";

import { Upload, Cpu, BookOpen, GraduationCap, CheckCircle, BarChart3, ChevronRight } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Teacher uploads textbook",
    description: "Import textbooks, PDFs, or lecture notes directly into the platform."
  },
  {
    icon: Cpu,
    title: "AI builds knowledge graph",
    description: "Lumina parses content to build a semantic knowledge graph and mastery nodes."
  },
  {
    icon: BookOpen,
    title: "Lessons generated automatically",
    description: "Personalized learning modules are created based on the institution's curriculum."
  },
  {
    icon: GraduationCap,
    title: "Students learn with AI tutor",
    description: "Context-aware AI tutor guides students through their personalized learning path."
  },
  {
    icon: CheckCircle,
    title: "Teacher verifies answers",
    description: "Unique verification queue where teachers validate AI-generated interactions."
  },
  {
    icon: BarChart3,
    title: "Platform learns from interaction",
    description: "Continuous model refinement based on every student-teacher-AI exchange."
  }
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-surface-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 font-display">
            How <span className="text-lumina-accent">Lumina Works</span>
          </h2>
          <p className="text-lg text-slate-400 font-sans">
            A seamless bridge between high-quality educational materials and adaptive AI-driven mastery.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line (Desktop) */}
          <div className="hidden lg:block absolute top-[60px] left-[5%] right-[5%] h-0.5 bg-gradient-to-r from-lumina-primary/0 via-lumina-primary/20 to-lumina-primary/0" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center group relative">
                <div className="w-24 h-24 rounded-3xl bg-surface-950 border border-white/5 flex items-center justify-center mb-8 relative z-10 group-hover:border-lumina-primary/30 transition-all duration-500 shadow-2xl group-hover:shadow-primary-glow group-hover:-translate-y-1">
                  <step.icon className="h-10 w-10 text-lumina-primary" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-lumina-primary text-white text-xs font-black flex items-center justify-center border-4 border-surface-900">
                    {index + 1}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-4 font-display group-hover:text-lumina-primary transition-colors min-h-[56px] flex items-center justify-center">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-sans px-2">
                  {step.description}
                </p>

                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-[44px] -right-[10px] z-20 text-lumina-primary/30">
                     <ChevronRight className="h-8 w-8" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-lumina-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-lumina-accent/5 rounded-full blur-[100px] pointer-events-none" />
    </section>
  );
}
