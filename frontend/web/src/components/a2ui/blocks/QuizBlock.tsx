"use client";

import React, { useMemo, useState } from "react";
import { type QuizBlock } from "@/lib/a2ui-schema";
import { BrainCircuit, CheckCircle2, HelpCircle, RotateCcw, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface QuizResultProps {
  block: QuizBlock;
}

export const QuizResult: React.FC<QuizResultProps> = ({ block }) => {
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [hintOpen, setHintOpen] = useState<Record<number, boolean>>({});

  const totalQuestions = block.content.questions.length;
  const answeredCount = Object.keys(submitted).length;
  const allSubmitted = totalQuestions > 0 && answeredCount === totalQuestions;
  const correctCount = useMemo(
    () =>
      block.content.questions.reduce((count, question, index) => {
        if (!submitted[index]) return count;
        return selections[index] === question.correctIndex ? count + 1 : count;
      }, 0),
    [block.content.questions, selections, submitted],
  );

  const handleReset = () => {
    setSelections({});
    setSubmitted({});
    setHintOpen({});
  };

  return (
    <div className="my-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <BrainCircuit className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-text">
          {block.content.title || "Knowledge check"}
        </h3>
        {block.content.difficulty && (
          <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
            {block.content.difficulty}
          </span>
        )}
        {answeredCount > 0 && (
          <span className="text-xs text-text-secondary">
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
              "rounded-2xl border p-5 shadow-sm transition-all",
              isSubmitted
                ? isCorrect
                  ? "border-green-500/20 bg-green-500/10"
                  : "border-red-500/20 bg-red-500/10"
                : "border-border bg-surface-elevated",
            )}
          >
            <p className="mb-4 text-sm font-medium leading-relaxed text-text">
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
                        "border-border bg-surface text-text-secondary hover:border-primary/30 hover:bg-primary/5",
                      !isSubmitted &&
                        isSelected &&
                        "border-primary/40 bg-primary/10 text-text",
                      isSubmitted &&
                        isSelected &&
                        isCorrect &&
                        "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300",
                      isSubmitted &&
                        isSelected &&
                        !isCorrect &&
                        "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
                      isSubmitted &&
                        isAnswer &&
                        !isSelected &&
                        "border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-300",
                      isSubmitted &&
                        !isSelected &&
                        !isAnswer &&
                        "border-border/50 bg-surface/40 text-text-muted",
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span>{option}</span>
                      {isSubmitted && isSelected && isCorrect && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                      )}
                      {isSubmitted && isSelected && !isCorrect && (
                        <XCircle className="h-4 w-4 shrink-0 text-red-500" />
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
                  className="border-primary/20 bg-transparent text-primary hover:bg-primary/10"
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
                variant="primary"
                onClick={() =>
                  setSubmitted((current) => ({ ...current, [questionIndex]: true }))
                }
                disabled={selectedOption === undefined || isSubmitted}
              >
                Check answer
              </Button>
            </div>

            {question.hint && hintOpen[questionIndex] && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary"
              >
                {question.hint}
              </motion.div>
            )}

            {isSubmitted && question.explanation && (
              <div className="mt-3 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-secondary">
                {question.explanation}
              </div>
            )}
          </div>
        );
      })}

      {allSubmitted && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">Final score:</span>
            <span
              className={cn(
                "text-lg font-bold",
                correctCount === totalQuestions
                  ? "text-green-500"
                  : correctCount >= totalQuestions / 2
                    ? "text-primary"
                    : "text-red-500",
              )}
            >
              {correctCount}/{totalQuestions}
            </span>
            {correctCount === totalQuestions && (
              <span className="text-sm text-green-500 font-medium">Perfect!</span>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-border bg-transparent text-text-secondary hover:border-primary hover:text-primary"
            onClick={handleReset}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      )}
    </div>

  );
};
