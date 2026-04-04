"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { type TextBlock } from "@/lib/a2ui-schema";
import { FileText } from "lucide-react";

interface TextResultProps {
  block: TextBlock;
}

export const TextResult: React.FC<TextResultProps> = ({ block }) => {
  const { title, summary, bullets, markdown } = block.content;

  return (
    <div className="my-4 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
      {(title || summary) && (
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-xl bg-sky-400/10 p-2">
            <FileText className="h-4 w-4 text-sky-200" />
          </div>
          <div>
            {title && <h3 className="text-base font-semibold text-white">{title}</h3>}
            {summary && <p className="mt-1 text-sm text-slate-300">{summary}</p>}
          </div>
        </div>
      )}

      <div className="prose prose-invert max-w-none text-sm leading-relaxed text-slate-100">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>

      {bullets && bullets.length > 0 && (
        <ul className="mt-4 space-y-2">
          {bullets.map((bullet, index) => (
            <li
              key={`${bullet}-${index}`}
              className="flex items-start gap-2 text-sm text-slate-300"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
