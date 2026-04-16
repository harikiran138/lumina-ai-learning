"use client";

import React from "react";
import { motion } from "framer-motion";

interface RolePurposeProps {
  content: string;
}

const RolePurpose = ({ content }: RolePurposeProps) => {
  return (
    <section className="py-20 bg-surface border-y border-border">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-block px-3 py-1 rounded-md bg-surface-elevated border border-border text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Role Significance
          </div>
          <h2 className="text-4xl font-black text-text font-display tracking-tight leading-tight">
            The Purpose of <br/><span className="text-primary">This Connection</span>
          </h2>
          <p className="text-xl text-text-secondary leading-relaxed font-sans max-w-2xl">
            {content}
          </p>
        </div>
      </div>
    </section>
  );
};

export default RolePurpose;
