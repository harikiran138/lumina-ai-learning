"use client";

import React from "react";
import { motion } from "framer-motion";

interface RolePurposeProps {
  content: string;
}

const RolePurpose = ({ content }: RolePurposeProps) => {
  return (
    <section className="py-20 bg-black border-y border-white/5">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-block px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Role Significance
          </div>
          <h2 className="text-4xl font-black text-white font-display tracking-tight leading-tight">
            The Purpose of <br/><span className="gradient-text-gold">This Connection</span>
          </h2>
          <p className="text-xl text-zinc-300 leading-relaxed font-sans max-w-2xl">
            {content}
          </p>
        </div>
      </div>
    </section>
  );
};

export default RolePurpose;
