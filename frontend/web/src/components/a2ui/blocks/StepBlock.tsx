import React from "react";
import { StepBlock } from "@/lib/a2ui-schema";
import { ListOrdered } from "lucide-react";

interface StepResultProps {
  block: StepBlock;
}

export const StepResult: React.FC<StepResultProps> = ({ block }) => {
  return (
    <div className="my-4 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-md">
          <ListOrdered className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {block.title}
        </h3>
      </div>
      <div className="space-y-3">
        {block.steps.map((step, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold font-mono border border-emerald-200 dark:border-emerald-800">
              {idx + 1}
            </div>
            <p className="text-zinc-700 dark:text-zinc-300 text-sm pt-0.5 leading-relaxed">
              {step}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
