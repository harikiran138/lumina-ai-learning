"use client";

import React, { useState } from "react";
import { type ReflectionBlock } from "@/lib/a2ui-schema";
import { PenTool } from "lucide-react";

interface ReflectionResultProps {
  block: ReflectionBlock;
}

export const ReflectionResult: React.FC<ReflectionResultProps> = ({ block }) => {
  const [response, setResponse] = useState("");

  return (
    <div className="my-6 rounded-2xl border border-amber-300/15 bg-amber-300/10 p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-xl bg-amber-300/10 p-2">
          <PenTool className="h-4 w-4 text-amber-200" />
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-100">
          {block.content.title || "Reflection"}
        </h3>
      </div>

      <p className="mb-3 text-sm font-medium text-white">{block.content.prompt}</p>

      <textarea
        className="min-h-[88px] w-full resize-none rounded-xl border border-white/8 bg-black/20 p-3 text-sm text-slate-100 outline-none transition-all focus:border-amber-300/30"
        placeholder={block.content.placeholder || "Type your thoughts here..."}
        value={response}
        onChange={(event) => setResponse(event.target.value)}
      />
    </div>
  );
};
