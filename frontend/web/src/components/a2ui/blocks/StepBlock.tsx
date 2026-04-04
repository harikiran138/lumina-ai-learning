"use client";

import React, { useMemo, useState } from "react";
import { type StepsBlock } from "@/lib/a2ui-schema";
import { Lightbulb, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepResultProps {
  block: StepsBlock;
}

export const StepResult: React.FC<StepResultProps> = ({ block }) => {
  const totalSteps = block.content.steps.length;
  const interactive =
    block.ui?.interactive ||
    block.ui?.reveal === "stepwise" ||
    block.content.steps.some((step) => Boolean(step.hint));

  const [visibleCount, setVisibleCount] = useState(interactive ? 1 : totalSteps);
  const [shownHints, setShownHints] = useState<Record<number, boolean>>({});

  const visibleSteps = useMemo(
    () => block.content.steps.slice(0, visibleCount),
    [block.content.steps, visibleCount],
  );

  // "Show hint" applies to the LAST visible step's hint, not the first unrevealed one
  const currentStepIndex = visibleCount - 1;
  const currentStep = block.content.steps[currentStepIndex];
  const canRevealHint =
    block.ui?.allowHints !== false &&
    Boolean(currentStep?.hint) &&
    !shownHints[currentStepIndex];

  return (
    <div className="my-4 rounded-2xl border border-white/8 bg-white/[0.03] p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-amber-400/10 p-2">
          <ListOrdered className="h-5 w-5 text-amber-300" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            {block.content.title}
          </h3>
          {block.content.summary && (
            <p className="mt-1 text-sm text-slate-300">{block.content.summary}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {visibleSteps.map((step, index) => (
          <div
            key={`${step.title || "step"}-${index}`}
            className="rounded-xl border border-white/6 bg-black/10 p-4"
          >
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 text-xs font-semibold text-amber-100">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                {step.title && (
                  <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                )}
                <p className="text-sm leading-relaxed text-slate-200">{step.body}</p>
                {step.hint && shownHints[index] && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{step.hint}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {interactive && (
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-amber-300/20 bg-transparent text-amber-100 hover:bg-amber-300/10"
            onClick={() =>
              setShownHints((current) => ({ ...current, [currentStepIndex]: true }))
            }
            disabled={!canRevealHint}
          >
            Show hint
          </Button>
          <Button
            type="button"
            className="bg-amber-300 text-black hover:bg-amber-200"
            onClick={() => setVisibleCount((count) => Math.min(count + 1, totalSteps))}
            disabled={visibleCount >= totalSteps}
          >
            Next step
          </Button>
        </div>
      )}
    </div>
  );
};
