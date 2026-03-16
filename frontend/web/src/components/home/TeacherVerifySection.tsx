"use client";

import { UserCheck, ShieldCheck, MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react";

export default function TeacherVerifySection() {
  return (
    <section id="verification" className="py-24 relative overflow-hidden bg-slate-900/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-lumina-accent/10 border border-lumina-accent/20">
               <ShieldCheck className="h-4 w-4 text-lumina-accent" />
               <span className="text-xs font-bold text-lumina-accent uppercase tracking-widest">Human-in-the-Loop AI</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight font-display">
              AI Powered by <br />
              <span className="text-lumina-accent">Human Verification</span>
            </h2>
            
            <p className="text-lg text-slate-400 font-sans max-w-xl">
              Lumina eliminates "AI hallucinations" by placing educators at the heart of the system. Every core lesson and adaptive response passes through a teacher-verified verification queue.
            </p>

            <ul className="space-y-4">
              {[
                "Teachers audit AI-generated course blueprints",
                "Real-time flagging of sensitive or inaccurate content",
                "Administrative oversight on all AI-student interactions",
                "Continuous feedback loop improves the local AI model"
              ].map((item, i) => (
                <li key={i} className="flex items-center space-x-3 text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-lumina-accent" />
                  <span className="font-sans">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1 w-full relative">
            <div className="glass-panel p-8 relative z-10 border-white/10 group">
              <div className="flex justify-between items-center mb-8">
                <h4 className="text-white font-bold font-display">Verification Queue</h4>
                <div className="h-3 w-12 bg-lumina-accent/20 rounded-full animate-pulse" />
              </div>
              
              <div className="space-y-4">
                {/* Simulated Verification Card */}
                <div className="glass-v2 p-5 border-lumina-accent/30 bg-lumina-accent/5">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] bg-lumina-accent/20 text-lumina-accent px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Awaiting Review</span>
                    <span className="text-[10px] text-slate-500">2 mins ago</span>
                  </div>
                  <p className="text-sm text-slate-200 mb-4 font-sans italic">"Explain the core of quantum superposition for a 10th grader..."</p>
                  <div className="flex space-x-3">
                    <button className="flex-1 py-2 rounded-lg bg-lumina-accent text-white text-xs font-bold hover:bg-lumina-accent-dark transition-colors">Approve</button>
                    <button className="flex-1 py-2 rounded-lg border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/5">Edit</button>
                  </div>
                </div>

                {/* Second item */}
                <div className="glass-v2 p-5 border-white/5 opacity-50">
                  <p className="text-sm text-slate-400 mb-2 font-sans">Next: "Algebraic identities module..."</p>
                  <div className="h-1.5 w-full bg-white/5 rounded-full" />
                </div>
              </div>

              {/* Floaties */}
              <div className="absolute -right-12 top-10 w-24 h-24 bg-lumina-primary/30 rounded-3xl blur-2xl -z-10 animate-blob" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
