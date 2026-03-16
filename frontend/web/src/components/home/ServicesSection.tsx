"use client";

import { 
  Zap, 
  Brain, 
  ShieldCheck, 
  Users, 
  BookOpen, 
  BarChart4, 
  Lock, 
  Cpu, 
  UserCheck 
} from "lucide-react";

const services = [
  {
    category: "For Students",
    items: [
      {
        icon: Brain,
        title: "AI Personal Tutor",
        description: "24/7 adaptive guidance that builds a personalized knowledge graph for every learner."
      },
      {
        icon: Zap,
        title: "Adaptive Pathways",
        description: "Real-time mastery tracking that adjusts course difficulty based on your unique learning pace."
      },
      {
        icon: Lock,
        title: "Privacy-First Notes",
        description: "Encrypted personal study materials with zero-knowledge architecture."
      }
    ]
  },
  {
    category: "For Teachers",
    items: [
      {
        icon: UserCheck,
        title: "Verification System",
        description: "Human-in-the-loop AI validation ensuring 100% academic accuracy and integrity."
      },
      {
        icon: BookOpen,
        title: "Content Studio",
        description: "Transform static course materials into interactive, AI-powered learning modules in minutes."
      },
      {
        icon: BarChart4,
        title: "Class Analytics",
        description: "Deep insights into student mastery gaps and engagement without compromising privacy."
      }
    ]
  },
  {
    category: "For Institutions",
    items: [
      {
        icon: ShieldCheck,
        title: "Enterprise Governance",
        description: "Strict RBAC and k-anonymity compliance to protect institutional data at scale."
      },
      {
        icon: Cpu,
        title: "Scalable Architecture",
        description: "Modular microservices designed for high performance and seamless LMS integration."
      },
      {
        icon: Users,
        title: "Research Insights",
        description: "Anonymized datasets for educational science and policy impact studies."
      }
    ]
  }
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-24 relative overflow-hidden bg-surface-950/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Everything You Need to <span className="gradient-text">Master Learning</span>
          </h2>
          <p className="text-lg text-gray-400">
            Lumina combines cutting-edge AI with strict human verification to provide a safe, effective, and truly personal education.
          </p>
        </div>

        <div className="space-y-20">
          {services.map((group, gIndex) => (
            <div key={gIndex}>
              <h3 className="text-xl font-bold text-lumina-primary mb-8 uppercase tracking-widest text-center sm:text-left">
                {group.category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {group.items.map((service, sIndex) => (
                  <div key={sIndex} className="glass-v2 p-8 group hover:border-lumina-primary/30 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-lumina-primary/10 transition-colors">
                      <service.icon className="h-6 w-6 text-lumina-primary" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-3">{service.title}</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
