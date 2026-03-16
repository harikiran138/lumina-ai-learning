import React, { useMemo } from "react";
import { A2UIResponse, A2UIBlock } from "@/lib/a2ui-schema";
import { ConceptResult } from "./blocks/ConceptBlock";
import { StepResult } from "./blocks/StepBlock";
import { QuizResult } from "./blocks/QuizBlock";
import { FlashcardResult } from "./blocks/FlashcardBlock";
import { DiagramResult } from "./blocks/DiagramBlock";
import { TableResult } from "./blocks/TableBlock";
import { ReflectionResult } from "./blocks/ReflectionBlock";
import ReactMarkdown from "react-markdown";

interface A2UIRendererV2Props {
  content: string;
}

export const A2UIRendererV2: React.FC<A2UIRendererV2Props> = ({ content }) => {
  const parsedResponse = useMemo(() => {
    try {
      // 1. Try strict JSON parse
      const data = JSON.parse(content);

      // 2. Validate basic structure (duck typing for now, use Zod in real prod)
      if (data && data.meta && Array.isArray(data.flow)) {
        return data as A2UIResponse;
      }
      return null;
    } catch (e) {
      // 3. Fallback: Check for markdown code block with json
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const data = JSON.parse(jsonMatch[1]);
          if (data && data.meta && Array.isArray(data.flow)) {
            return data as A2UIResponse;
          }
        } catch (e2) {
          // Invalid JSON in code block
        }
      }
      return null;
    }
  }, [content]);

  // Fallback to markdown renderer if not valid A2UI JSON
  if (!parsedResponse) {
    return (
      <div className="prose pamber-sm dark:pamber-invert max-w-none text-zinc-700 dark:text-zinc-300 leading-relaxed">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  // Render A2UI Flow
  return (
    <div className="a2ui-container space-y-2">
      {/* Optional: Render Meta Info (e.g. Difficulty Badge) */}
      {parsedResponse.meta && (
        <div className="flex items-center gap-2 mb-4 text-xs text-zinc-400 font-mono uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <span>{parsedResponse.meta.topic}</span>
          <span>•</span>
          <span
            className={
              parsedResponse.meta.difficulty === "hard"
                ? "text-red-500"
                : parsedResponse.meta.difficulty === "medium"
                  ? "text-amber-500"
                  : "text-green-500"
            }
          >
            {parsedResponse.meta.difficulty}
          </span>
          <span>•</span>
          <span>{parsedResponse.meta.estimated_time_min} min</span>
        </div>
      )}

      {parsedResponse.flow.map((block: A2UIBlock, idx: number) => {
        switch (block.type) {
          case "concept":
            return <ConceptResult key={idx} block={block} />;
          case "steps":
            return <StepResult key={idx} block={block} />;
          case "quiz":
            return <QuizResult key={idx} block={block} />;
          case "flashcards":
            return <FlashcardResult key={idx} block={block} />;
          case "diagram":
            return <DiagramResult key={idx} block={block} />;
          case "table":
            return <TableResult key={idx} block={block} />;
          case "reflection":
            return <ReflectionResult key={idx} block={block} />;
          case "text":
            return (
              <div
                key={idx}
                className="prose pamber-sm dark:pamber-invert max-w-none my-4"
              >
                <ReactMarkdown>{block.content}</ReactMarkdown>
              </div>
            );
          default:
            return (
              <div
                key={idx}
                className="p-4 bg-red-50 text-red-600 rounded-md text-xs"
              >
                ⚠️ Unknown block type: {(block as any).type}
              </div>
            );
        }
      })}
    </div>
  );
};
