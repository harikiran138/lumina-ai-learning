"use client";

import {
  CheckCircle2,
  FileUp,
  Pen,
  Brain,
  Users2,
  BarChart4,
  Lock,
} from "lucide-react";

const solutions = [
  {
    icon: CheckCircle2,
    title: "Teacher-Verified AI Queue",
    description:
      "Every AI answer is held in a faculty review queue. No response reaches a student until a teacher approves, edits, or rejects it.",
    highlight: true,
  },
  {
    icon: FileUp,
    title: "PDF → Full Course in 15 Minutes",
    description:
      "Upload any textbook PDF and Lumina auto-generates unit modules, topics, PPT slides, and assignments — fully structured and ready to publish.",
    highlight: false,
  },
  {
    icon: Pen,
    title: "Handwritten OCR Grading",
    description:
      "Students scan paper answers. TrOCR + Gemini Vision transcribes handwriting, AI evaluates against rubrics, teacher gives final score.",
    highlight: false,
  },
  {
    icon: Brain,
    title: "FSRS Spaced Repetition",
    description:
      "Flashcards powered by FSRS v5 — the state-of-the-art spaced repetition algorithm used by top memory researchers worldwide.",
    highlight: false,
  },
  {
    icon: BarChart4,
    title: "Dropout Prediction Engine",
    description:
      "ML-based risk scoring monitors attendance, grades, and engagement patterns. Counselors and HODs are alerted before students fall through the cracks.",
    highlight: false,
  },
  {
    icon: Lock,
    title: "Self-Hosted & Privacy-First",
    description:
      "Deploy entirely on your institution's infrastructure. Student data never leaves your servers. Full compliance, zero vendor lock-in.",
    highlight: false,
  },
];

export default function SolutionSection() {
  return (
    <section className="py-28 relative overflow-hidden bg-black">
      {/* Ambient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-lumina-highlight/[0.025] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-block px-4 py-1.5 rounded-full bg-lumina-highlight/10 border border-lumina-highlight/20 text-lumina-highlight text-xs font-black uppercase tracking-[0.22em] mb-6">
            How Lumina Solves It
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 font-display tracking-tight leading-[0.95]">
            Six Pillars of the{" "}
            <span className="gradient-text-gold">Lumina Architecture</span>
          </h2>
          <p className="text-lg text-slate-400 font-sans leading-relaxed max-w-2xl mx-auto">
            Not a chatbot wrapper — a full engineering-grade LMS with real AI pipelines,
            human oversight baked in, and performance-optimized for scale.
          </p>
        </div>

        {/* Solutions grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((s, i) => (
            <div
              key={i}
              className={`relative glass-v2-gold p-8 flex flex-col group hover:-translate-y-1 transition-all duration-500 ${
                s.highlight
                  ? "border-lumina-highlight/30 bg-lumina-highlight/[0.04] shadow-[0_0_40px_rgba(255,215,0,0.06)]"
                  : ""
              }`}
            >
              {s.highlight && (
                <div className="absolute top-4 right-4">
                  <span className="text-[9px] font-black text-lumina-highlight uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-lumina-highlight/15 border border-lumina-highlight/30">
                    Signature Feature
                  </span>
                </div>
              )}

              <div className="w-12 h-12 rounded-2xl bg-lumina-highlight/10 border border-lumina-highlight/20 flex items-center justify-center mb-6 group-hover:bg-lumina-highlight/18 group-hover:border-lumina-highlight/35 transition-all duration-300">
                <s.icon className="h-6 w-6 text-lumina-highlight" />
              </div>
              <h3 className="text-xl font-black text-white mb-3 font-display tracking-tight group-hover:text-lumina-highlight transition-colors duration-300">
                {s.title}
              </h3>
              <p className="text-slate-400 font-sans leading-relaxed text-[15px] flex-1">
                {s.description}
              </p>

              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-lumina-highlight/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
