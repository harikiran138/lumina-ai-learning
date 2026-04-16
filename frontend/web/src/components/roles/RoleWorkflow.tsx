"use client";

import React from "react";
import { motion } from "framer-motion";

interface RoleWorkflowProps {
  steps: string[];
}

const RoleWorkflow = ({ steps }: RoleWorkflowProps) => {
  return (
    <section className="py-32 bg-surface">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-text font-display tracking-tight mb-12 text-center uppercase italic tracking-widest">
            Real-World <span className="text-primary">Workflow</span>
          </h2>
          
          <div className="space-y-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-6 p-8 rounded-3xl bg-surface-elevated border border-border hover:bg-surface transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-black dark:group-hover:text-black transition-all">
                  <span className="font-black text-sm">{i + 1}</span>
                </div>
                <p className="text-lg text-text-secondary font-sans leading-relaxed pt-1.5 italic">
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
