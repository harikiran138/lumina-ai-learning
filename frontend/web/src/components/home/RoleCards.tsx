"use client";

import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Users,
  Shield,
  Heart,
  Search,
  Award,
  HardHat,
  Crown,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

const roles = [
  {
    icon: GraduationCap,
    title: "Student",
    purpose: "Adaptive learning + AI tutor",
    access: "Own progress & flashcards",
    slug: "student",
  },
  {
    icon: BookOpen,
    title: "Faculty",
    purpose: "Content creation & AI verification",
    access: "Class analytics, verification queue",
    slug: "faculty",
  },
  {
    icon: Shield,
    title: "HOD",
    purpose: "Department governance",
    access: "Risk scores, attendance, grades",
    slug: "hod",
  },
  {
    icon: Crown,
    title: "Institution Admin",
    purpose: "Institutional operations",
    access: "All institutional data",
    slug: "admin",
  },
  {
    icon: Heart,
    title: "Parent",
    purpose: "Monitor child progress",
    access: "Restricted progress view",
    slug: "parent",
  },
  {
    icon: Users,
    title: "Peer Mentor",
    purpose: "Guidance & support",
    access: "Mentee performance data",
    slug: "mentor",
  },
  {
    icon: Search,
    title: "Counselor",
    purpose: "Safeguarding & wellbeing",
    access: "Encrypted student notes",
    slug: "counselor",
  },
  {
    icon: Award,
    title: "Alumni",
    purpose: "Industry mentorship",
    access: "Mentorship impact tracking",
    slug: "alumni",
  },
  {
    icon: HardHat,
    title: "Super Admin",
    purpose: "Platform management",
    access: "System-wide configuration",
    slug: "super-admin",
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
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-lumina-highlight/10 border border-lumina-highlight/20 text-lumina-highlight text-xs font-black uppercase tracking-[0.22em] mb-6"
          >
            Role Architecture
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 font-display tracking-tight leading-[1.0]"
          >
            One Platform.{" "}
            <span className="gradient-text-gold">9 Defined Roles.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400 font-sans leading-relaxed max-w-2xl mx-auto"
          >
            Every user in the educational ecosystem has a distinct interface, data boundary, 
            and permission scope — perfectly synchronized for mission-critical operations.
          </motion.p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {roles.map((role, i) => (
            <Link
              key={i}
              href={`/roles/${role.slug}`}
              className="group block"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="glass-v2-gold h-full p-8 flex flex-col items-center text-center hover:bg-white/[0.05] hover:border-lumina-highlight/40 transition-all duration-500 relative overflow-hidden cursor-pointer"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-lumina-highlight/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                <div className="w-16 h-16 rounded-2xl bg-lumina-highlight/10 border border-lumina-highlight/15 flex items-center justify-center mb-6 group-hover:bg-lumina-highlight/20 group-hover:border-lumina-highlight/35 group-hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all duration-400 relative z-10">
                  <role.icon className="h-8 w-8 text-lumina-highlight" />
                </div>
                
                <h3 className="text-xl font-black text-white mb-2 font-display relative z-10">{role.title}</h3>
                
                <p className="text-xs text-amber-400 font-black uppercase tracking-[0.15em] mb-4 leading-tight relative z-10">
                  {role.purpose}
                </p>
                
                <div className="pt-4 border-t border-white/5 w-full relative z-10">
                  <p className="text-xs text-slate-500 font-sans leading-relaxed mb-4">{role.access}</p>
                  
                  <div className="flex items-center justify-center space-x-1 text-xs font-black uppercase tracking-widest text-lumina-highlight opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span>Learn More</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
