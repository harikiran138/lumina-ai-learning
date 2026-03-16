import React, { useState } from "react";
import { QuizBlock } from "@/lib/a2ui-schema";
import { CheckCircle2, XCircle, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizResultProps {
  block: QuizBlock;
}

export const QuizResult: React.FC<QuizResultProps> = ({ block }) => {
  // Track selected answers: { [questionIndex]: selectedOptionIndex }
  const [selections, setSelections] = useState<Record<number, number>>({});
  // Track submitted status per question: { [questionIndex]: true }
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  const handleSelect = (qIdx: number, oIdx: number) => {
    if (submitted[qIdx]) return;
    setSelections((prev) => ({ ...prev, [qIdx]: oIdx }));
  };

  const handleSubmit = (qIdx: number) => {
    if (selections[qIdx] === undefined) return;
    setSubmitted((prev) => ({ ...prev, [qIdx]: true }));
  };

  return (
    <div className="my-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <BrainCircuit className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
          Knowledge Check
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 uppercase tracking-wider font-medium">
          {block.difficulty}
        </span>
      </div>

      {block.questions.map((q, qIdx) => {
        const isSubmitted = submitted[qIdx];
        const isCorrect = isSubmitted && selections[qIdx] === q.answer;
        const width = block.questions.length > 1 ? "w-full" : "w-full"; // Keeping layout consistent

        return (
          <div
            key={qIdx}
            className={cn(
              "p-5 rounded-lg border bg-white dark:bg-zinc-900 shadow-sm transition-all",
              isSubmitted
                ? isCorrect
                  ? "border-green-200 dark:border-green-900/50"
                  : "border-red-200 dark:border-red-900/50"
                : "border-zinc-200 dark:border-zinc-800",
            )}
          >
            <p className="font-medium text-zinc-800 dark:text-zinc-200 mb-4">
              {q.question}
            </p>

            <div className="space-y-2">
              {q.options.map((opt, oIdx) => {
                const isSelected = selections[qIdx] === oIdx;
                const isAnswer = oIdx === q.answer;

                let optionClass =
                  "w-full text-left p-3 rounded-md text-sm transition-all border ";

                if (isSubmitted) {
                  if (isSelected && isCorrect) {
                    optionClass +=
                      "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-300 font-medium";
                  } else if (isSelected && !isCorrect) {
                    optionClass +=
                      "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-300";
                  } else if (isAnswer && !isCorrect) {
                    optionClass +=
                      "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-300 opacity-75"; // Show correct answer
                  } else {
                    optionClass += "border-transparent opacity-50";
                  }
                } else {
                  if (isSelected) {
                    optionClass +=
                      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-700 dark:text-yellow-300";
                  } else {
                    optionClass +=
                      "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400";
                  }
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelect(qIdx, oIdx)}
                    disabled={isSubmitted}
                    className={optionClass}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt}</span>
                      {isSubmitted &&
                        isSelected &&
                        (isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 ml-2" />
                        ) : (
                          <XCircle className="w-4 h-4 ml-2" />
                        ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {!isSubmitted ? (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleSubmit(qIdx)}
                  disabled={selections[qIdx] === undefined}
                  className="px-4 py-1.5 text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  Check Answer
                </button>
              </div>
            ) : (
              q.explanation && (
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400 italic">
                  {q.explanation}
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
};
