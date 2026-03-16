"use client";

import { CheckCircle2, Search, UserCheck, Database, FileCheck } from "lucide-react";

const verificationSteps = [
  {
    icon: Database,
    title: "AI Generates Knowledge",
    description: "System extracts concepts and generates explanations from textbook data."
  },
  {
    icon: Search,
    title: "Verification Queue",
    description: "Responses enter a specialized queue for human teacher review."
  },
  {
    icon: UserCheck,
    title: "Teacher Validation",
    description: "Teachers approve, modify, or reject AI-generated learning nodes."
  },
  {
    icon: FileCheck,
    title: "Verified Knowledge Base",
    description: "Only human-approved content becomes part of the student learning pathways."
  }
];

export default function VerificationSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-surface-950/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Human-in-the-Loop Verification
          </h2>
          <p className="text-lg text-gray-400">
            Unlike generic AI, Lumina ensures educational integrity through a unique verification system where every answer is teacher-approved.
          </p>
        </div>

        <div className="academic-grid">
          {verificationSteps.map((step, index) => (
            <div key={index} className="col-span-12 md:col-span-6 lg:col-span-3 glass-v2 p-8 relative group">
              {index < verificationSteps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 z-20">
                  <CheckCircle2 className="h-6 w-6 text-white/10 group-hover:text-lumina-primary transition-colors" />
                </div>
              )}
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:shadow-gold-glow transition-all duration-300">
                <step.icon className="h-7 w-7 text-lumina-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 glass-panel rounded-2xl p-8 border border-lumina-primary/20 flex flex-col md:flex-row items-center justify-between">
           <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-12 h-12 rounded-full bg-lumina-primary/20 flex items-center justify-center">
                 <Shield className="h-6 w-6 text-lumina-primary" />
              </div>
              <div>
                 <h4 className="text-lg font-bold text-white">Zero-Trust Educational Guardrails</h4>
                 <p className="text-sm text-gray-400">Ensuring zero hallucinations in critical learning materials.</p>
              </div>
           </div>
           <button className="glass-button py-2 px-6 rounded-lg text-sm">Learn About Verification</button>
        </div>
      </div>
    </section>
  );
}

function Shield(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        </svg>
    )
}
