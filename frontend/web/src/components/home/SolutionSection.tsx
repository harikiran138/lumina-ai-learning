"use client";

import { Sparkles, ShieldCheck, Zap, Layers, Users2 } from "lucide-react";

const solutions = [
  {
    icon: Zap,
    title: "AI Tutoring",
    description: "24/7 personalized AI support that understands each student's unique knowledge graph."
  },
  {
    icon: Layers,
    title: "Adaptive Engine",
    description: "Deep Knowledge Tracing (DKT) and Bayesian Knowledge Tracing (BKT) to model mastery."
  },
  {
    icon: ShieldCheck,
    title: "Teacher Verified",
    description: "Human-in-the-loop system ensures every AI-generated response is accurate and approved."
  },
  {
    icon: ShieldCheck,
    title: "Privacy First",
    description: "Enterprise-grade security with role-based access and anonymized research data protection."
  },
  {
    icon: Users2,
    title: "Multi-Role Collaboration",
    description: "Seamless coordination between students, teachers, parents, and administrative staff."
  },
  {
    icon: Sparkles,
    title: "Instant Content",
    description: "Automatically transform curriculum documents into interactive learning pathways."
  }
];

export default function SolutionSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            A Complete Learning Ecosystem
          </h2>
          <p className="text-lg text-gray-400">
            Lumina is more than an LMS. It's an intelligent platform designed to empower every stakeholder in the education process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((solution, index) => (
            <div key={index} className="glass-v2-gold p-8 group">
              <div className="w-12 h-12 rounded-xl bg-lumina-primary/10 flex items-center justify-center mb-6 group-hover:bg-lumina-primary/20 transition-colors">
                <solution.icon className="h-6 w-6 text-lumina-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-lumina-primary transition-colors">
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl max-h-4xl bg-lumina-primary/5 rounded-full blur-[180px] pointer-events-none" />
    </section>
  );
}
