"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck } from "lucide-react";

interface RoleAccessProps {
  see: string[];
  do: string[];
}

const RoleAccess = ({ see, do: actions }: RoleAccessProps) => {
  return (
    <section className="py-24 bg-black">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-black text-white font-display tracking-tight mb-16">
          Access & <span className="gradient-text-gold">Privileges</span>
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl">
          <div className="p-10 rounded-[40px] bg-white/[0.03] border border-white/[0.08] shadow-2xl relative overflow-hidden transition-colors hover:bg-white/[0.05]">
            <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.25em] mb-8 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              What you can see
            </h4>
            <ul className="space-y-5 relative z-10">
              {see.map((item, i) => (
                <li 
                  key={i} 
                  className="flex items-start space-x-3 text-white/80 group"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500/60 shrink-0 mt-0.5" />
                  <span className="text-base font-medium leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-10 rounded-[40px] bg-white/[0.03] border border-white/[0.08] shadow-2xl relative overflow-hidden transition-colors hover:bg-white/[0.05]">
            <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.25em] mb-8 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              What you can do
            </h4>
            <ul className="space-y-5 relative z-10">
              {actions.map((item, i) => (
                <li 
                  key={i} 
                  className="flex items-start space-x-3 text-white/80 group"
                >
                  <div className="w-5 h-5 rounded bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  </div>
                  <span className="text-base font-medium leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoleAccess;
