"use client";

import React from "react";
import { type ConceptBlock } from "@/lib/a2ui-schema";
import { Lightbulb } from "lucide-react";

interface ConceptResultProps {
  block: ConceptBlock;
}

export const ConceptResult: React.FC<ConceptResultProps> = ({ block }) => {
  return (
    <div className="my-4 rounded-2xl border border-white/8 bg-white/[0.03] p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-xl bg-amber-400/10 p-2">
          <Lightbulb className="h-5 w-5 text-amber-300" />
        </div>
        <h3 className="text-lg font-semibold text-white">
          {block.content.title}
        </h3>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-slate-200">
        {block.content.summary}
      </p>
      {block.content.keyPoints && block.content.keyPoints.length > 0 && (
        <ul className="space-y-2">
          {block.content.keyPoints.map((point, index) => (
            <li
              key={`${point}-${index}`}
              className="flex items-start gap-2 text-sm text-slate-300"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
