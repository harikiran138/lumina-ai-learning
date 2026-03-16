"use client";

import { CheckCircle2, TrendingUp, Sparkles, Shield } from "lucide-react";

const groups = [
  {
    category: "For Students",
    benefits: [
      "Personalized learning at 10x speed",
      "24/7 AI tutor that never gets tired",
      "Lessons tailored to your unique gaps",
      "Gamified progression & badges"
    ]
  },
  {
    category: "For Teachers",
    benefits: [
      "80% reduction in admin workload",
      "Real-time student mastery alerts",
      "Automated lesson plan generation",
      "Human-verified AI confidence"
    ]
  },
  {
    category: "For Institutions",
    benefits: [
      "Unified educational data layer",
      "Strict data sovereignty & privacy",
      "Scalable adaptive infrastructure",
      "Advanced research & growth analytics"
    ]
  }
];

export default function BenefitsSection() {
  return (
    <section id="benefits" className="py-24 relative overflow-hidden bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 font-display">
            The Impact of <span className="gradient-text">Lumina</span>
          </h2>
          <p className="text-lg text-slate-400 font-sans">
            Personalized education isn't just a goal — it's a measurable improvement across every role in the ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {groups.map((group, index) => (
            <div key={index} className="glass-v2 p-10 group hover:border-lumina-primary/30 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {index === 0 ? <Sparkles className="h-24 w-24" /> : index === 1 ? <TrendingUp className="h-24 w-24" /> : <Shield className="h-24 w-24" />}
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-8 font-display border-b border-white/5 pb-4">{group.category}</h3>
              <ul className="space-y-6">
                {group.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start space-x-4">
                    <CheckCircle2 className="h-6 w-6 text-lumina-accent flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300 font-sans leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
