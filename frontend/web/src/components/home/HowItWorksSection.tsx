"use client";

import { Upload, Cpu, GraduationCap, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload Materials",
    description: "Import textbooks, PDFs, or lecture notes directly into the platform."
  },
  {
    icon: Cpu,
    title: "AI Analysis",
    description: "Lumina builds a semantic knowledge graph and generates adaptive nodes."
  },
  {
    icon: CheckCircle,
    title: "Teacher Verify",
    description: "Instructors audit AI-generated content to ensure 100% accuracy."
  },
  {
    icon: GraduationCap,
    title: "Personalized Study",
    description: "Students learn with a verified AI tutor on custom pathways."
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            The Lumina Workflow
          </h2>
          <p className="text-lg text-gray-400">
            From raw content to mastery. See how Lumina transforms the educational experience in four simple steps.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-lumina-primary/0 via-lumina-primary/20 to-lumina-primary/0" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-2xl bg-surface-900 border border-white/5 flex items-center justify-center mb-6 relative z-10 group-hover:border-lumina-primary/30 transition-all duration-300 shadow-xl group-hover:shadow-gold-glow">
                  <step.icon className="h-10 w-10 text-lumina-primary" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-lumina-primary text-black text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-lumina-primary transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
