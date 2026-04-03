"use client";

import React from "react";
import { motion } from "framer-motion";
import { Cpu } from "lucide-react";

interface Feature {
  name: string;
  explanation: string;
}

interface RoleFeaturesProps {
  features: Feature[];
}

const RoleFeatures = ({ features }: RoleFeaturesProps) => {
  return (
    <section className="py-24 bg-white/[0.02]">
      <div className="container mx-auto px-6">
        <div className="mb-16">
          <h2 className="text-4xl font-black text-white font-display tracking-tight mb-4">
            Key <span className="gradient-text-gold">Functionalities</span>
          </h2>
          <p className="text-slate-500 max-w-xl">
            Deeply integrated features powered by the Lumina Agentic AI Engine.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] hover:border-lumina-highlight/30 transition-all duration-500 group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-lumina-highlight/10 transition-colors">
                <Cpu className="w-6 h-6 text-slate-400 group-hover:text-lumina-highlight" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">{feature.name}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {feature.explanation}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RoleFeatures;
