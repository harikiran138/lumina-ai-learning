"use client";

import React from "react";
import { motion } from "framer-motion";

interface RoleWorkflowProps {
  steps: string[];
}

const RoleWorkflow = ({ steps }: RoleWorkflowProps) => {
  return (
    <section className="py-32 bg-black">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-white font-display tracking-tight mb-12 text-center uppercase italic tracking-widest">
            Real-World <span className="gradient-text-gold">Workflow</span>
          </h2>
          
          <div className="space-y-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-6 p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-lumina-highlight/10 flex items-center justify-center shrink-0 border border-lumina-highlight/20 group-hover:bg-lumina-highlight group-hover:text-black transition-all">
                  <span className="font-black text-sm">{i + 1}</span>
                </div>
                <p className="text-lg text-zinc-300 font-sans leading-relaxed pt-1.5 italic">
                  {step}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoleWorkflow;
