import React, { useState } from "react";
import { ReflectionBlock } from "@/lib/a2ui-schema";
import { PenTool } from "lucide-react";

interface ReflectionResultProps {
  block: ReflectionBlock;
}

export const ReflectionResult: React.FC<ReflectionResultProps> = ({
  block,
}) => {
  const [response, setResponse] = useState("");

  return (
    <div className="my-6 p-5 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/10 dark:to-zinc-900 border border-indigo-100 dark:border-indigo-900/30 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-md">
          <PenTool className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm uppercase tracking-wide">
          Reflection
        </h3>
      </div>

      <p className="text-zinc-700 dark:text-zinc-300 font-medium mb-3">
        {block.prompt}
      </p>

      <textarea
        className="w-full p-3 text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none min-h-[80px]"
        placeholder={block.placeholder || "Type your thoughts here..."}
        value={response}
        onChange={(e) => setResponse(e.target.value)}
      />
    </div>
  );
};
