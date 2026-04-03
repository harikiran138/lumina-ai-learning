"use client";

import React from "react";
import { motion } from "framer-motion";
import { Link2 } from "lucide-react";

interface Interaction {
  role: string;
  explanation: string;
}

interface RoleInteractionsProps {
  interactions: Interaction[];
}

const RoleInteractions = ({ interactions }: RoleInteractionsProps) => {
  return (
    <section className="py-24 bg-white/[0.02]">
      <div className="container mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-3xl font-black text-white font-display tracking-tight mb-2 uppercase italic tracking-widest opacity-50">Architectural Dependencies</h2>
          <h3 className="text-xl font-bold text-slate-400 italic">This role is connected to:</h3>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interactions.map((conn, i) => (
            <div key={i} className="flex items-start space-x-5 p-8 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-all duration-300">
              <Link2 className="w-5 h-5 text-lumina-highlight shrink-0 mt-1 opacity-40 group-hover:opacity-100 transition-opacity" />
              <div>
                <h4 className="text-white font-black text-sm uppercase tracking-widest mb-4">{conn.role}</h4>
                <p className="text-sm text-slate-500 leading-relaxed font-sans italic">{conn.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RoleInteractions;
