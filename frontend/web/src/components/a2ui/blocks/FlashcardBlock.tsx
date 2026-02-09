import React, { useState } from "react";
import { FlashcardBlock } from "@/lib/a2ui-schema";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FlashcardResultProps {
  block: FlashcardBlock;
}

export const FlashcardResult: React.FC<FlashcardResultProps> = ({ block }) => {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  const toggleFlip = (idx: number) => {
    setFlipped((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="my-6">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
          Flashcards
        </h3>
        <span className="text-xs text-zinc-400">
          ({block.cards.length} cards)
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x pr-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
        {block.cards.map((card, idx) => {
          const isFlipped = flipped[idx];
          return (
            <div
              key={idx}
              className="snap-center flex-shrink-0 w-[240px] h-[160px] perspective-1000 cursor-pointer group"
              onClick={() => toggleFlip(idx)}
            >
              <div
                className={cn(
                  "relative w-full h-full transition-all duration-500 preserve-3d shadow-sm hover:shadow-md",
                  isFlipped ? "rotate-y-180" : "",
                )}
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center p-6 text-center">
                  <span className="text-xs font-semibold text-amber-500 mb-2 uppercase tracking-widest">
                    Term
                  </span>
                  <p className="font-bold text-lg text-zinc-800 dark:text-zinc-100">
                    {card.front}
                  </p>
                  <span className="absolute bottom-3 text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to flip
                  </span>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 backface-hidden bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-xl flex flex-col items-center justify-center p-6 text-center rotate-y-180"
                  style={{ transform: "rotateY(180deg)" }}
                >
                  <span className="text-xs font-semibold text-amber-600 mb-2 uppercase tracking-widest">
                    Definition
                  </span>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 leading-relaxed">
                    {card.back}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
