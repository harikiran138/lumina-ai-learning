"use client";

import React, { useMemo, useState } from "react";
import { type QuizBlock } from "@/lib/a2ui-schema";
import { BrainCircuit, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface QuizResultProps {
  block: QuizBlock;
}

export const QuizResult: React.FC<QuizResultProps> = ({ block }) => {
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [hintOpen, setHintOpen] = useState<Record<number, boolean>>({});

  const answeredCount = Object.keys(submitted).length;
  const correctCount = useMemo(
    () =>
      block.content.questions.reduce((count, question, index) => {
        if (!submitted[index]) return count;
        return selections[index] === question.correctIndex ? count + 1 : count;
      }, 0),
    [block.content.questions, selections, submitted],
  );

  return (
    <div className="my-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <BrainCircuit className="h-5 w-5 text-amber-300" />
        <h3 className="font-semibold text-white">
          {block.content.title || "Knowledge check"}
        </h3>
        {block.content.difficulty && (
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-100">
            {block.content.difficulty}
          </span>
        )}
        {answeredCount > 0 && (
          <span className="text-xs text-slate-400">
            Score: {correctCount}/{answeredCount}
          </span>
        )}
      </div>

      {block.content.questions.map((question, questionIndex) => {
        const isSubmitted = Boolean(submitted[questionIndex]);
        const selectedOption = selections[questionIndex];
        const isCorrect =
          isSubmitted && selectedOption === question.correctIndex;

        return (
          <div
            key={`${question.prompt}-${questionIndex}`}
            className={cn(
              "rounded-2xl border p-5 shadow-sm",
              isSubmitted
                ? isCorrect
                  ? "border-emerald-400/20 bg-emerald-400/10"
                  : "border-red-400/20 bg-red-400/10"
                : "border-white/8 bg-white/[0.03]",
            )}
          >
            <p className="mb-4 text-sm font-medium leading-relaxed text-white">
              {question.prompt}
            </p>

            <div className="space-y-2">
              {question.options.map((option, optionIndex) => {
                const isSelected = selectedOption === optionIndex;
                const isAnswer = optionIndex === question.correctIndex;

                return (
                  <button
                    key={`${option}-${optionIndex}`}
                    type="button"
                    onClick={() => {
                      if (!isSubmitted) {
                        setSelections((current) => ({
                          ...current,
                          [questionIndex]: optionIndex,
                        }));
                      }
                    }}
                    disabled={isSubmitted}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left text-sm transition-all",
                      !isSubmitted &&
                        "border-white/8 bg-black/10 text-slate-200 hover:border-amber-300/30 hover:bg-amber-300/10",
                      !isSubmitted &&
                        isSelected &&
                        "border-amber-300/40 bg-amber-300/10 text-white",
                      isSubmitted &&
                        isSelected &&
                        isCorrect &&
                        "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
                      isSubmitted &&
                        isSelected &&
                        !isCorrect &&
                        "border-red-400/40 bg-red-400/10 text-red-100",
                      isSubmitted &&
                        isAnswer &&
                        !isSelected &&
                        "border-emerald-400/30 bg-emerald-400/5 text-emerald-100",
                      isSubmitted &&
                        !isSelected &&
                        !isAnswer &&
                        "border-white/5 bg-white/[0.02] text-slate-400",
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span>{option}</span>
                      {isSubmitted && isSelected && isCorrect && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-200" />
                      )}
                      {isSubmitted && isSelected && !isCorrect && (
                        <XCircle className="h-4 w-4 shrink-0 text-red-200" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {question.hint && block.ui?.interactive && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-amber-300/20 bg-transparent text-amber-100 hover:bg-amber-300/10"
                  onClick={() =>
                    setHintOpen((current) => ({
                      ...current,
                      [questionIndex]: !current[questionIndex],
                    }))
                  }
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Show hint
                </Button>
              )}
              <Button
                type="button"
                className="bg-amber-300 text-black hover:bg-amber-200"
                onClick={() =>
                  setSubmitted((current) => ({ ...current, [questionIndex]: true }))
                }
                disabled={selectedOption === undefined || isSubmitted}
              >
                Check answer
              </Button>
            </div>

            {question.hint && hintOpen[questionIndex] && (
              <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
                {question.hint}
              </div>
            )}

            {isSubmitted && question.explanation && (
              <div className="mt-3 rounded-xl border border-white/6 bg-black/10 px-3 py-2 text-sm text-slate-200">
                {question.explanation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
