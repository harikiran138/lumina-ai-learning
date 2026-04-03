"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const RoleIndexHeader = () => (
  <div className="container mx-auto px-6 text-center mb-20">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-lumina-highlight/10 border border-lumina-highlight/20 mb-6"
    >
      <Sparkles className="w-4 h-4 text-lumina-highlight" />
      <span className="text-lumina-highlight text-[10px] font-black uppercase tracking-widest">Ecosystem Deep Dive</span>
    </motion.div>
    <motion.h1 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-5xl lg:text-7xl font-black mb-6 font-display tracking-tight"
    >
      The <span className="gradient-text-gold">Role Architecture</span>
    </motion.h1>
    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed"
    >
      Lumina is built on a foundation of clearly defined boundaries and synergistic relationships. 
      Select a role below to explore its specific capabilities, data access, and system-wide impact.
    </motion.p>
  </div>
);

export default RoleIndexHeader;
