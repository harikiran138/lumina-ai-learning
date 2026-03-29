"use client";

import { AlertTriangle, Clock, ShieldOff, FileX } from "lucide-react";

const problems = [
  {
    icon: AlertTriangle,
    title: "Unverified AI Answers",
    description:
      "Most LMS platforms let AI respond directly to students — hallucinations, wrong formulas, and unvetted content reach classrooms with zero teacher oversight.",
    tag: "AI Safety",
  },
  {
    icon: Clock,
    title: "Weeks to Create a Course",
    description:
      "Teachers spend 20+ hours turning a textbook chapter into structured lessons. Existing tools offer no pipeline — just a blank canvas and empty promises.",
    tag: "Teacher Workload",
  },
  {
    icon: FileX,
    title: "Handwritten Exams Are Dead Weight",
    description:
      "Paper answer sheets sit in piles for days. No digital trail, no AI assistance, no feedback loop — while students wait blindly for results.",
    tag: "Assessment Gap",
  },
  {
    icon: ShieldOff,
    title: "Cloud-First = Data Risk",
    description:
      "Student performance data, attendance, and behaviour profiles stored offshore by third-party vendors — outside institutional control or regulatory compliance.",
    tag: "Privacy",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-28 relative overflow-hidden bg-black">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-lumina-highlight/5 rounded-full blur-[130px] pointer-events-none translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/4 rounded-full blur-[110px] pointer-events-none -translate-x-1/3" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-block px-4 py-1.5 rounded-full bg-lumina-highlight/10 border border-lumina-highlight/20 text-lumina-highlight text-xs font-black uppercase tracking-[0.22em] mb-6">
            The Problem
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 font-display tracking-tight leading-[0.95]">
            Every LMS Is <br />
            <span className="gradient-text-gold">Broken the Same Way</span>
          </h2>
          <p className="text-lg text-slate-400 font-sans leading-relaxed">
            The engineering college classroom deserves better than a file-upload portal
            slapped with a chatbot and called "AI-powered."
          </p>
        </div>

        {/* Problem cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {problems.map((p, i) => (
            <div
              key={i}
              className="relative glass-v2-gold p-8 group overflow-hidden hover:-translate-y-1 transition-all duration-500"
            >
              {/* Background icon watermark */}
              <div className="absolute top-4 right-4 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-500">
                <p.icon className="h-20 w-20 text-lumina-highlight" />
              </div>

              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-lumina-highlight/10 border border-lumina-highlight/20 flex items-center justify-center group-hover:bg-lumina-highlight/15 transition-all duration-300">
                  <p.icon className="h-6 w-6 text-lumina-highlight" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-black text-white font-display tracking-tight">
                      {p.title}
                    </h3>
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 whitespace-nowrap">
                      {p.tag}
                    </span>
                  </div>
                  <p className="text-slate-400 font-sans leading-relaxed text-[15px]">
                    {p.description}
                  </p>
                </div>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-lumina-highlight/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
