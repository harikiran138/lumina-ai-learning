"use client";

import { User, Users, Shield, GraduationCap, Briefcase, Microscope, Heart, Search, UserCheck, HardHat } from "lucide-react";

const roles = [
  {
    icon: GraduationCap,
    title: "Student",
    purpose: "Personalized learning paths",
    dataAccess: "Own progress & AI tutor"
  },
  {
    icon: Briefcase,
    title: "Teacher",
    purpose: "Content creation & verification",
    dataAccess: "Class analytics & content"
  },
  {
    icon: Heart,
    title: "Parent",
    purpose: "Monitor child progress",
    dataAccess: "Restricted progress view"
  },
  {
    icon: Users,
    title: "Mentor",
    purpose: "Guidance & support",
    dataAccess: "Mentee performance data"
  },
  {
    icon: User,
    title: "Peer Tutor",
    purpose: "Collaborative learning",
    dataAccess: "Limited peer interaction"
  },
  {
    icon: Search,
    title: "Counselor",
    purpose: "Safeguarding & wellbeing",
    dataAccess: "Encrypted student notes"
  },
  {
    icon: Microscope,
    title: "Researcher",
    purpose: "Educational impact studies",
    dataAccess: "Anonymized datasets"
  },
  {
    icon: UserCheck,
    title: "Content Creator",
    purpose: "Curriculum development",
    dataAccess: "Knowledge graph tools"
  },
  {
    icon: Shield,
    title: "Institution Admin",
    purpose: "System governance",
    dataAccess: "All institutional data"
  },
  {
    icon: HardHat,
    title: "Super Admin",
    purpose: "Platform management",
    dataAccess: "System-wide configuration"
  }
];

export default function RoleCards() {
  return (
    <section id="roles" className="py-24 relative overflow-hidden bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-24">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 font-display leading-tight">
            One Platform, <span className="text-lumina-highlight">10 Defined Roles</span>
          </h2>
          <p className="text-xl text-slate-400 font-sans max-w-2xl mx-auto leading-relaxed">
            Lumina is architected to serve the entire educational ecosystem, with distinct data boundaries and specialized interfaces for every human in the loop.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {roles.map((role, index) => (
            <div key={index} className="glass-v2-primary p-7 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-500">
              <div className="w-16 h-16 rounded-2xl bg-lumina-primary/10 flex items-center justify-center mb-6 group-hover:bg-lumina-primary/20 transition-all duration-300 transform group-hover:rotate-6 shadow-primary-glow">
                <role.icon className="h-8 w-8 text-lumina-primary" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-display">{role.title}</h3>
              <p className="text-xs text-lumina-accent mb-4 font-bold uppercase tracking-wider">{role.purpose}</p>
              <div className="mt-auto pt-5 border-t border-white/5 w-full">
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-2">Access Boundary</p>
                <p className="text-xs text-slate-400 font-sans leading-tight">{role.dataAccess}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Background Neural Grid */}
      <div className="absolute inset-0 opacity-[0.03] neural-mesh pointer-events-none" />
    </section>
  );
}
