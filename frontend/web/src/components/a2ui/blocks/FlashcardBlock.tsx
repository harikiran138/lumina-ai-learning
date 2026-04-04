"use client";

import React, { useState } from "react";
import { type FlashcardsBlock } from "@/lib/a2ui-schema";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashcardResultProps {
  block: FlashcardsBlock;
}

export const FlashcardResult: React.FC<FlashcardResultProps> = ({ block }) => {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  return (
    <div className="my-6">
      <div className="mb-3 flex items-center gap-2">
        <Layers className="h-5 w-5 text-amber-300" />
        <h3 className="font-semibold text-white">
          {block.content.title || "Flashcards"}
        </h3>
        <span className="text-xs text-slate-400">
          ({block.content.cards.length} cards)
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3">
        {block.content.cards.map((card, index) => {
          const isFlipped = Boolean(flipped[index]);

          return (
            <button
              key={`${card.front}-${index}`}
              type="button"
              onClick={() =>
                setFlipped((current) => ({ ...current, [index]: !current[index] }))
              }
              className="w-[240px] shrink-0 text-left"
            >
              <div
                className={cn(
                  "min-h-[168px] rounded-2xl border p-5 transition-all",
                  isFlipped
                    ? "border-amber-300/20 bg-amber-300/10"
                    : "border-white/8 bg-white/[0.03]",
                )}
              >
                <div className="mb-3 text-[10px] uppercase tracking-[0.3em] text-slate-400">
                  {isFlipped ? "Answer" : "Prompt"}
                </div>
                <p className="text-sm font-medium leading-relaxed text-white">
                  {isFlipped ? card.back : card.front}
                </p>
                <div className="mt-4 text-[10px] uppercase tracking-[0.24em] text-slate-500">
                  Tap to flip
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
