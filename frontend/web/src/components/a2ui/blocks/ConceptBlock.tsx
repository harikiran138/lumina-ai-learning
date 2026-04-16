"use client";

import React from "react";
import { type ConceptBlock } from "@/lib/a2ui-schema";
import { Lightbulb } from "lucide-react";

interface ConceptResultProps {
  block: ConceptBlock;
}

export const ConceptResult: React.FC<ConceptResultProps> = ({ block }) => {
  return (
    <div className="my-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-xl bg-primary/10 p-2">
          <Lightbulb className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-text">
          {block.content.title}
        </h3>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        {block.content.summary}
      </p>
      {block.content.keyPoints && block.content.keyPoints.length > 0 && (
        <ul className="space-y-2">
          {block.content.keyPoints.map((point, index) => (
            <li
              key={`${point}-${index}`}
              className="flex items-start gap-2 text-sm text-text-secondary"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
