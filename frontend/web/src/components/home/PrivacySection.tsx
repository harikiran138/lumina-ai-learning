"use client";

import { ShieldCheck, Lock, EyeOff, FileKey, Check } from "lucide-react";

const trustPoints = [
  {
    icon: Lock,
    title: "Data Sovereignty",
    description: "Institutions retain full ownership of their data. Lumina never sells or shares student information."
  },
  {
    icon: ShieldCheck,
    title: "Encryption at Rest",
    description: "AES-256 encryption for all data stores, with personalized keys for every institution."
  },
  {
    icon: EyeOff,
    title: "Anonymized Research",
    description: "Multi-layered scrubbing ensures all research data is 100% anonymous and non-traceable."
  },
  {
    icon: FileKey,
    title: "GDPR & FERPA Ready",
    description: "Built-in compliance modules that adapt to regional privacy laws and institutional requirements."
  }
];

export default function PrivacySection() {
  return (
    <section id="privacy" className="py-24 relative overflow-hidden bg-neutral-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 font-display">
            Privacy-First <span className="text-lumina-accent">Architecture</span>
          </h2>
          <p className="text-lg text-zinc-400 font-sans">
            Security isn't a feature; it's our foundation. Lumina is designed to protect student data at every layer of the stack.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustPoints.map((point, index) => (
            <div key={index} className="glass-v2-primary p-8 border-white/5 hover:border-lumina-accent/20 group transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-lumina-accent/10 flex items-center justify-center mb-6 group-hover:bg-lumina-accent/20 transition-all duration-300">
                <point.icon className="h-7 w-7 text-lumina-accent" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 font-display">{point.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed font-sans mb-6">
                {point.description}
              </p>
              <div className="flex items-center space-x-2 text-lumina-accent font-bold text-[10px] uppercase tracking-widest">
                <Check className="h-3 w-3" />
                <span>Verified Secure</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 p-8 glass-panel border-white/5 bg-white/[0.01] flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center space-x-6">
              <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-white font-black">L</div>
              <p className="text-sm text-zinc-400 font-sans italic">"Lumina's privacy architecture sets the gold standard for AI in education." — Dr. Sarah Chen, Research Governance</p>
           </div>
           <div className="flex space-x-8 opacity-40">
              <div className="text-[10px] font-black text-white py-2 px-4 border border-white/20 rounded">SOC2 TYPE II</div>
              <div className="text-[10px] font-black text-white py-2 px-4 border border-white/20 rounded">HIPAA COMPLIANT</div>
           </div>
        </div>
      </div>

      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-lumina-accent/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-lumina-primary/5 rounded-full blur-[100px] pointer-events-none" />
    </section>
  );
}
