"use client";

import { ShieldCheck, CheckCircle2, Edit3, XCircle, Clock } from "lucide-react";

const benefits = [
  "No AI answer reaches a student without teacher approval",
  "Faculty can approve, edit, or reject each queued response",
  "HOD and admin get full audit trail of all AI interactions",
  "Continuous feedback loop trains your institution's AI model",
];

const queueItems = [
  {
    status: "Awaiting Review",
    statusColor: "text-lumina-highlight",
    statusBg: "bg-lumina-highlight/10",
    statusBorder: "border-lumina-highlight/25",
    question: "Explain Newton's second law with a real-world engineering example.",
    aiAnswer:
      "Newton's second law states F = ma. In structural engineering, this means a bridge beam under load must resist force proportional to its mass times acceleration...",
    time: "just now",
    active: true,
  },
  {
    status: "Approved",
    statusColor: "text-emerald-400",
    statusBg: "bg-emerald-400/10",
    statusBorder: "border-emerald-400/20",
    question: "What is the difference between RAM and ROM?",
    aiAnswer: "RAM is volatile memory used for active processes...",
    time: "3 mins ago",
    active: false,
  },
];

export default function TeacherVerifySection() {
  return (
    <section id="verification" className="py-28 relative overflow-hidden bg-black">
      <div className="absolute inset-0 neural-mesh opacity-[0.04] pointer-events-none" />
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-lumina-highlight/6 rounded-full blur-[130px] pointer-events-none -translate-x-1/2" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-start gap-16">
          {/* Left: Copy */}
          <div className="flex-1 space-y-8 lg:pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lumina-highlight/10 border border-lumina-highlight/25">
              <ShieldCheck className="h-4 w-4 text-lumina-highlight" />
              <span className="text-xs font-black text-lumina-highlight uppercase tracking-[0.2em]">
                Human-in-the-Loop
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white font-display leading-[1.0] tracking-tight">
              AI Answers Locked
              <br />
              <span className="gradient-text-gold">Until a Teacher Unlocks Them</span>
            </h2>

            <p className="text-lg text-slate-400 font-sans leading-relaxed max-w-xl">
              Lumina's Teacher Verification Queue is not optional and not bypassable.
              Every AI-generated response goes into a pending state. A faculty member
              must approve it before any student sees it.
            </p>

            <ul className="space-y-3">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-lumina-highlight flex-shrink-0 mt-0.5" />
                  <span className="font-sans leading-snug">{b}</span>
                </li>
              ))}
            </ul>

            {/* Stat callout */}
            <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl border border-lumina-highlight/20 bg-lumina-highlight/5">
              <span className="text-4xl font-black text-lumina-highlight font-display">100%</span>
              <span className="text-sm font-bold text-slate-300 leading-tight">
                of AI answers verified by a<br />
                <span className="text-lumina-highlight">real faculty member</span> before delivery
              </span>
            </div>
          </div>

          {/* Right: Live queue mockup */}
          <div className="flex-1 w-full">
            <div className="glass-panel p-6 border-lumina-highlight/15 relative overflow-hidden">
              {/* Queue header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-lumina-highlight animate-pulse" />
                  <h4 className="text-white font-black font-display text-sm uppercase tracking-widest">
                    Verification Queue
                  </h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Live</span>
                </div>
              </div>

              {/* Queue items */}
              <div className="space-y-4">
                {queueItems.map((item, i) => (
                  <div
                    key={i}
                    className={`p-5 rounded-2xl border transition-all duration-300 ${
                      item.active
                        ? `${item.statusBorder} ${item.statusBg}`
                        : "border-white/5 bg-white/[0.01] opacity-60"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span
                        className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${item.statusBg} ${item.statusBorder} ${item.statusColor}`}
                      >
                        {item.status}
                      </span>
                      <span className="text-[10px] text-slate-500">{item.time}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-bold mb-1.5 uppercase tracking-wide">
                      Student asked:
                    </p>
                    <p className="text-sm text-white font-sans mb-3 italic">"{item.question}"</p>

                    {item.active && (
                      <>
                        <p className="text-[11px] text-slate-400 font-bold mb-1.5 uppercase tracking-wide">
                          AI Answer:
                        </p>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed mb-4 line-clamp-2">
                          {item.aiAnswer}
                        </p>
                        <div className="flex gap-2">
                          <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-lumina-highlight text-black text-xs font-black hover:bg-yellow-400 transition-colors">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/5 transition-colors">
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/10 transition-colors">
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Glow */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-lumina-highlight/15 rounded-full blur-3xl pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
