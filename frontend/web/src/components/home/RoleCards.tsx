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
    <section className="py-24 relative overflow-hidden bg-surface-950/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Designed for Every Role
          </h2>
          <p className="text-lg text-gray-400">
            Lumina provides a tailored experience for all 10 platform roles, each with strict data access boundaries.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {roles.map((role, index) => (
            <div key={index} className="glass-v2 p-6 flex flex-col items-center text-center group">
              <div className="w-12 h-12 rounded-full bg-lumina-primary/10 flex items-center justify-center mb-4 group-hover:bg-lumina-primary/30 transition-all duration-300 transform group-hover:scale-110">
                <role.icon className="h-6 w-6 text-lumina-primary" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{role.title}</h3>
              <p className="text-sm text-lumina-primary/80 mb-2 font-medium">{role.purpose}</p>
              <div className="mt-auto pt-4 border-t border-white/5 w-full">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Access Boundary</span>
                <span className="text-xs text-gray-400">{role.dataAccess}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
