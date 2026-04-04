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
    title: "Teacher",
    purpose: "Content creation & AI verification",
    access: "Class analytics, verification queue",
    slug: "teacher",
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
            className="text-lg text-zinc-400 font-sans leading-relaxed max-w-2xl mx-auto"
          >
            Every user in the educational ecosystem has a distinct interface, data boundary, 
            and permission scope — perfectly synchronized for mission-critical operations.
          </motion.p>
        </div>

        {/* Compact Role Grid */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
          {roles.map((role, i) => (
            <Link
              key={i}
              href={`/roles/${role.slug}`}
              className="group relative"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-all duration-300 w-24 sm:w-28 md:w-32"
              >
                {/* Minimal Icon Container */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-3 group-hover:bg-lumina-highlight/10 group-hover:border-lumina-highlight/30 group-hover:shadow-[0_0_20px_rgba(255,215,0,0.15)] transition-all duration-300">
                  <role.icon className="h-6 w-6 sm:h-7 sm:w-7 text-zinc-400 group-hover:text-lumina-highlight transition-colors duration-300" />
                </div>
                
                <span className="text-[11px] sm:text-xs font-black text-zinc-400 group-hover:text-white uppercase tracking-[0.12em] text-center transition-colors duration-300">
                  {role.title}
                </span>

                {/* Subtle underline on hover */}
                <div className="w-0 h-[2px] bg-lumina-highlight mt-1.5 group-hover:w-full transition-all duration-300 opacity-0 group-hover:opacity-100" />
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
