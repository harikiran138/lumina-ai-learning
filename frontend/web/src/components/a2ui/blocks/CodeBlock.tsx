"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { type CodeBlock } from "@/lib/a2ui-schema";
import { Badge } from "@/components/ui/badge";
import { Code2 } from "lucide-react";

interface CodeResultProps {
  block: CodeBlock;
}

export const CodeResult: React.FC<CodeResultProps> = ({ block }) => {
  return (
    <div className="my-6 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="rounded-xl bg-emerald-400/10 p-2">
          <Code2 className="h-5 w-5 text-emerald-200" />
        </div>
        <h3 className="text-base font-semibold text-white">
          {block.content.title || block.content.filename || "Code example"}
        </h3>
        <Badge variant="outline" className="border-emerald-300/20 text-emerald-100">
          {block.content.language || "text"}
        </Badge>
        {block.content.filename && (
          <Badge variant="outline" className="border-white/10 text-slate-300">
            {block.content.filename}
          </Badge>
        )}
      </div>

      <pre className="overflow-x-auto rounded-2xl border border-white/8 bg-[#071019] p-4 text-sm leading-relaxed text-slate-100">
        <code>{block.content.code}</code>
      </pre>

      {block.content.explanation && (
        <div className="prose prose-invert mt-4 max-w-none text-sm text-slate-200">
          <ReactMarkdown>{block.content.explanation}</ReactMarkdown>
        </div>
      )}

      {block.content.output && (
        <div className="mt-4 rounded-xl border border-white/8 bg-black/20 p-3">
          <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-400">
            Output
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-slate-200">
            {block.content.output}
          </pre>
        </div>
      )}
    </div>
  );
};
