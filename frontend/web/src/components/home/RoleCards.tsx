"use client";

import {
  GraduationCap,
  BookOpen,
  Users,
  Shield,
  Heart,
  UserCheck,
  Search,
  Microscope,
  User,
  HardHat,
  Crown,
} from "lucide-react";

const roles = [
  {
    icon: GraduationCap,
    title: "Student",
    purpose: "Adaptive learning + AI tutor",
    access: "Own progress & flashcards",
  },
  {
    icon: BookOpen,
    title: "Teacher",
    purpose: "Content creation & AI verification",
    access: "Class analytics, verification queue",
  },
  {
    icon: Users,
    title: "Faculty",
    purpose: "Course oversight & grading",
    access: "Department course data",
  },
  {
    icon: Shield,
    title: "HOD",
    purpose: "Department governance",
    access: "Risk scores, attendance, grades",
  },
  {
    icon: Crown,
    title: "Admin",
    purpose: "Institutional operations",
    access: "All institutional data",
  },
  {
    icon: Heart,
    title: "Parent",
    purpose: "Monitor child progress",
    access: "Restricted progress view",
  },
  {
    icon: User,
    title: "Mentor",
    purpose: "Guidance & support",
    access: "Mentee performance data",
  },
  {
    icon: UserCheck,
    title: "Peer Tutor",
    purpose: "Collaborative learning",
    access: "Limited peer interaction",
  },
  {
    icon: Search,
    title: "Counselor",
    purpose: "Safeguarding & wellbeing",
    access: "Encrypted student notes",
  },
  {
    icon: Microscope,
    title: "Researcher",
    purpose: "Educational impact studies",
    access: "Anonymized datasets only",
  },
  {
    icon: HardHat,
    title: "Super Admin",
    purpose: "Platform management",
    access: "System-wide configuration",
  },
];

export default function RoleCards() {
  return (
    <section id="roles" className="py-28 relative overflow-hidden bg-black">
      <div className="absolute inset-0 neural-mesh opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-lumina-highlight/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/4 rounded-full blur-[130px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-block px-4 py-1.5 rounded-full bg-lumina-highlight/10 border border-lumina-highlight/20 text-lumina-highlight text-xs font-black uppercase tracking-[0.22em] mb-6">
            Role Architecture
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 font-display tracking-tight leading-[1.0]">
            One Platform.{" "}
            <span className="gradient-text-gold">11 Defined Roles.</span>
          </h2>
          <p className="text-lg text-slate-400 font-sans leading-relaxed max-w-2xl mx-auto">
            Every user in the educational ecosystem has a distinct interface, data boundary,
            and permission scope — no one sees what they shouldn't.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5 max-w-7xl mx-auto">
          {roles.map((role, i) => (
            <div
              key={i}
              className="glass-v2-gold p-6 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-500 cursor-default"
            >
              <div className="w-14 h-14 rounded-2xl bg-lumina-highlight/10 border border-lumina-highlight/15 flex items-center justify-center mb-4 group-hover:bg-lumina-highlight/20 group-hover:border-lumina-highlight/35 group-hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all duration-400">
                <role.icon className="h-7 w-7 text-lumina-highlight" />
              </div>
              <h3 className="text-sm font-black text-white mb-1.5 font-display">{role.title}</h3>
              <p className="text-[10px] text-amber-400 font-black uppercase tracking-[0.12em] mb-3 leading-tight">
                {role.purpose}
              </p>
              <div className="pt-3 border-t border-white/5 w-full">
                <p className="text-[10px] text-slate-500 font-sans leading-snug">{role.access}</p>
              </div>
            </div>
          ))}

          {/* Empty spacer for grid alignment on xl */}
          <div className="hidden xl:block" />
        </div>
      </div>
    </section>
  );
}
