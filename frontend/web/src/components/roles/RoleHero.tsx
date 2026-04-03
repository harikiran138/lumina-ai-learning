"use client";

import React from "react";
import { motion } from "framer-motion";
import { Smartphone, LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface RoleHeroProps {
  title: string;
  tagline: string;
  purpose: string;
  iconName: string;
}

const RoleHero = ({ title, tagline, purpose, iconName }: RoleHeroProps) => {
  const Icon = (LucideIcons as any)[iconName] || Smartphone;

  return (
    <section className="relative pt-32 pb-16 overflow-hidden bg-transparent">
      <div className="absolute inset-0 neural-mesh opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-r from-amber-500/10 via-transparent to-transparent rounded-full blur-[120px] pointer-events-none opacity-30" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-lumina-highlight/10 border border-lumina-highlight/20 mb-8">
            <Icon className="w-4 h-4 text-lumina-highlight" />
            <span className="text-lumina-highlight text-[10px] font-black uppercase tracking-[0.25em]">{tagline}</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 font-display tracking-tight leading-[1.0]">
            {title}
          </h1>
          
          <p className="text-lg text-zinc-400 font-sans leading-relaxed max-w-2xl mx-auto">
            {purpose}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default RoleHero;
