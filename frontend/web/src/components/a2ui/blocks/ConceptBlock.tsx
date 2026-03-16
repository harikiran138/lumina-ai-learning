import React from "react";
import { ConceptBlock } from "@/lib/a2ui-schema";
import { Lightbulb } from "lucide-react";

interface ConceptResultProps {
  block: ConceptBlock;
}

export const ConceptResult: React.FC<ConceptResultProps> = ({ block }) => {
  return (
    <div className="my-4 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-md">
          <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {block.title}
        </h3>
      </div>
      <p className="text-zinc-700 dark:text-zinc-300 mb-4 leading-relaxed">
        {block.summary}
      </p>
      {block.key_points && block.key_points.length > 0 && (
        <ul className="space-y-2">
          {block.key_points.map((point, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400"
            >
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
