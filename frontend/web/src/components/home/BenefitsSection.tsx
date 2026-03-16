"use client";

import { useState } from "react";
import { GraduationCap, Briefcase, Building, Heart, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const benefitGroups = [
  {
    id: "students",
    label: "For Students",
    icon: GraduationCap,
    benefits: [
      "Personalized learning pathways that adapt in real-time.",
      "24/7 AI tutor support for every subject and concept.",
      "Gamified achievements and mastery-based progression.",
      "Instant feedback on assessments and homework."
    ],
    color: "from-amber-400 to-orange-500"
  },
  {
    id: "teachers",
    label: "For Teachers",
    icon: Briefcase,
    benefits: [
      "Automated content generation from textbooks/notes.",
      "AI-assisted grading and verification queue.",
      "Deep analytics on student misconceptions and growth.",
      "Automated lesson planning and objective mapping."
    ],
    color: "from-blue-400 to-indigo-500"
  },
  {
    id: "institutions",
    label: "For Institutions",
    icon: Building,
    benefits: [
      "Institution-wide learning analytics dashboards.",
      "Early warning systems for at-risk student detection.",
      "Scalable infrastructure for digital transformation.",
      "Privacy-first governance and role-based access."
    ],
    color: "from-emerald-400 to-teal-500"
  },
  {
    id: "parents",
    label: "For Parents",
    icon: Heart,
    benefits: [
      "Real-time insight into child's learning progress.",
      "Direct messaging channel with verified teachers.",
      "AI-generated weekly summaries and goal tracking.",
      "Secure and restricted visibility into learning outcomes."
    ],
    color: "from-rose-400 to-pink-500"
  }
];

export default function BenefitsSection() {
  const [activeTab, setActiveTab] = useState("students");
  const activeData = benefitGroups.find(g => g.id === activeTab)!;

  return (
    <section className="py-24 relative overflow-hidden bg-surface-950/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Impact Across the Ecosystem
          </h2>
          <p className="text-lg text-gray-400">
            Lumina is meticulously designed to deliver value to every stakeholder in the learning journey.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {benefitGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => setActiveTab(group.id)}
              className={cn(
                "flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-300 border",
                activeTab === group.id 
                  ? "bg-white/10 border-white/20 text-white shadow-xl shadow-white/5" 
                  : "bg-transparent border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10"
              )}
            >
              <group.icon className={cn("h-5 w-5", activeTab === group.id ? "text-lumina-primary" : "text-gray-600")} />
              <span className="font-bold">{group.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[400px]">
           <div className="glass-panel p-8 lg:p-12 rounded-3xl border border-white/5 relative overflow-hidden">
              <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2", activeData.color)} />
              
              <div className="relative z-10">
                 <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                    <activeData.icon className="h-8 w-8 mr-4 text-lumina-primary" />
                    Everything for {activeData.label}
                 </h3>
                 <div className="space-y-6">
                    {activeData.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-start space-x-4 group">
                         <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-lumina-primary/10 flex items-center justify-center group-hover:bg-lumina-primary/30 transition-colors">
                            <CheckCircle2 className="h-4 w-4 text-lumina-primary" />
                         </div>
                         <p className="text-gray-300 leading-relaxed font-medium">{benefit}</p>
                      </div>
                    ))}
                 </div>
                 
                 <div className="mt-12">
                    <button className="glass-button bg-white/5 border border-white/10 text-white hover:bg-white/10 py-3 px-8 rounded-xl font-bold transition-all">
                       Learn More <span className="ml-2">→</span>
                    </button>
                 </div>
              </div>
           </div>
           
           <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-lumina-primary/5 rounded-3xl blur-3xl opacity-50" />
              <div className="relative glass-panel aspect-video rounded-3xl border border-white/10 overflow-hidden flex items-center justify-center bg-surface-950">
                 {/* Visual representation change based on tab */}
                 <div className="text-center p-12">
                    <div className={cn("w-24 h-24 rounded-3xl bg-gradient-to-br flex items-center justify-center mb-8 mx-auto shadow-2xl", activeData.color)}>
                       <activeData.icon className="h-12 w-12 text-white" />
                    </div>
                    <h4 className="text-white text-xl font-bold mb-4">Optimized {activeData.label} Interface</h4>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">Experience the most advanced toolset ever built for {activeData.label.toLowerCase()}.</p>
                 </div>
                 <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">Live Preview</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
}
