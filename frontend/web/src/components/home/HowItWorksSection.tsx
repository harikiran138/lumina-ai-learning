"use client";

import { Upload, Cpu, LayoutGrid, GraduationCap, CheckCircle, TrendingUp, ChevronRight } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Teacher uploads a PDF",
    description:
      "Upload any textbook, lecture note, or syllabus. Lumina accepts any PDF or image format.",
    tag: "Input",
  },
  {
    icon: Cpu,
    title: "AI parses & structures it",
    description:
      "Gemini 1.5 Flash extracts topics, builds knowledge graphs, and generates unit modules automatically.",
    tag: "AI Engine",
  },
  {
    icon: LayoutGrid,
    title: "Course auto-generated",
    description:
      "Slides, assignments, flashcards, and a full unit plan are ready — in under 15 minutes, no manual structuring needed.",
    tag: "Content",
  },
  {
    icon: GraduationCap,
    title: "Students learn with AI tutor",
    description:
      "Students ask questions. The AI responds. Every answer is queued for faculty review before delivery.",
    tag: "Learning",
  },
  {
    icon: CheckCircle,
    title: "Teacher verifies AI answers",
    description:
      "Faculty approves, edits, or rejects each AI response via the Teacher Verification Queue. No shortcut bypasses this.",
    tag: "Verification",
  },
  {
    icon: TrendingUp,
    title: "Platform adapts & predicts",
    description:
      "FSRS spaced repetition, dropout risk scoring, and attendance tracking continuously improve every student's path.",
    tag: "Intelligence",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-28 relative overflow-hidden bg-black">
      <div className="absolute inset-0 neural-mesh opacity-[0.04] pointer-events-none" />
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-lumina-highlight/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-block px-4 py-1.5 rounded-full bg-lumina-highlight/10 border border-lumina-highlight/20 text-lumina-highlight text-xs font-black uppercase tracking-[0.22em] mb-6">
            How It Works
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 font-display tracking-tight leading-[1.0]">
            Upload a PDF.{" "}
            <span className="gradient-text-gold">Get a Full Course.</span>
          </h2>
          <p className="text-lg text-slate-400 font-sans leading-relaxed max-w-2xl mx-auto">
            The Lumina pipeline turns raw academic material into a live, AI-assisted,
            teacher-verified learning experience in six steps.
          </p>
        </div>

        {/* Steps grid */}
        <div className="relative">
          {/* Connecting line desktop */}
          <div className="hidden lg:block absolute top-[52px] left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-lumina-highlight/20 to-transparent pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center group relative">
                {/* Step badge */}
                <div className="relative z-10 w-[104px] h-[104px] rounded-3xl bg-black border border-lumina-highlight/15 flex items-center justify-center mb-6 group-hover:border-lumina-highlight/40 group-hover:bg-lumina-highlight/5 transition-all duration-500 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
                  <step.icon className="h-9 w-9 text-lumina-highlight" />
                  {/* Step number */}
                  <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-lumina-highlight text-black text-[11px] font-black flex items-center justify-center shadow-[0_0_12px_rgba(255,215,0,0.5)]">
                    {i + 1}
                  </div>
                </div>

                <div className="mb-2">
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    {step.tag}
                  </span>
                </div>

                <h3 className="text-sm font-black text-white mb-2 font-display group-hover:text-lumina-highlight transition-colors min-h-[40px] flex items-center justify-center leading-tight">
                  {step.title}
                </h3>
                <p className="text-[12px] text-slate-500 leading-relaxed font-sans px-1">
                  {step.description}
                </p>

                {/* Chevron connector */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-[44px] -right-[10px] z-20 text-lumina-highlight/25">
                    <ChevronRight className="h-6 w-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
