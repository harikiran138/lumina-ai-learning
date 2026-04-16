"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import {
  type A2UIBlock,
  type A2UIRenderable,
  parseA2UIContent,
} from "@/lib/a2ui-schema";
import { ConceptResult } from "./blocks/ConceptBlock";
import { StepResult } from "./blocks/StepBlock";
import { QuizResult } from "./blocks/QuizBlock";
import { FlashcardResult } from "./blocks/FlashcardBlock";
import { DiagramResult } from "./blocks/DiagramBlock";
import { TableResult } from "./blocks/TableBlock";
import { ReflectionResult } from "./blocks/ReflectionBlock";
import { TextResult } from "./blocks/TextBlock";
import { CodeResult } from "./blocks/CodeBlock";
import { GraphResult } from "./blocks/GraphBlock";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface A2UIRendererV2Props {
  content: string;
}

function renderBlock(block: A2UIBlock, index: number) {
  const key = block.id || `${block.type}-${index}`;

  switch (block.type) {
    case "text":
      return <TextResult key={key} block={block} />;
    case "quiz":
      return <QuizResult key={key} block={block} />;
    case "code":
      return <CodeResult key={key} block={block} />;
    case "graph":
      return <GraphResult key={key} block={block} />;
    case "steps":
      return <StepResult key={key} block={block} />;
    case "diagram":
      return <DiagramResult key={key} block={block} />;
    case "concept":
      return <ConceptResult key={key} block={block} />;
    case "table":
      return <TableResult key={key} block={block} />;
    case "flashcards":
      return <FlashcardResult key={key} block={block} />;
    case "reflection":
      return <ReflectionResult key={key} block={block} />;
    default:
      return null;
  }
}

function A2UIHeader({ parsed }: { parsed: A2UIRenderable }) {
  const meta = parsed.meta;
  const title =
    parsed.type === "lesson"
      ? parsed.content.title
      : "title" in parsed.content
        ? parsed.content.title
        : undefined;
  const summary =
    parsed.type === "lesson" ? parsed.content.summary : undefined;

  if (!title && !summary && !meta?.topic && !meta?.difficulty && !meta?.estimatedTimeMin) {
    return null;
  }

  return (
    <div className="mb-4 rounded-2xl border border-border bg-surface-elevated px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {title && (
          <h3 className="text-base font-semibold tracking-tight text-text">
            {title}
          </h3>
        )}
        {meta?.topic && meta.topic !== title && (
          <Badge variant="outline" className="border-primary/30 text-primary">
            {meta.topic}
          </Badge>
        )}
        {meta?.difficulty && (
          <Badge
            variant="outline"
            className={cn(
              "uppercase tracking-[0.2em]",
              meta.difficulty === "hard"
                ? "border-red-500/30 text-red-500"
                : meta.difficulty === "medium"
                  ? "border-primary/30 text-primary"
                  : "border-green-500/30 text-green-500",
            )}
          >
            {meta.difficulty}
          </Badge>
        )}
        {typeof meta?.estimatedTimeMin === "number" && (
          <Badge variant="outline" className="border-border text-text-secondary">
            {meta.estimatedTimeMin} min
          </Badge>
        )}
      </div>
      {summary && (
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{summary}</p>
      )}
    </div>
  );
}

export const A2UIRendererV2: React.FC<A2UIRendererV2Props> = ({ content }) => {
  const parsedResponse = useMemo(() => parseA2UIContent(content), [content]);

  if (!parsedResponse) {
    return (
      <div className="prose dark:prose-invert max-w-none text-text-secondary leading-relaxed">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  const blocks =
    parsedResponse.type === "lesson"
      ? parsedResponse.content.blocks
      : [parsedResponse];

  return (
    <div className="a2ui-container space-y-4">
      <A2UIHeader parsed={parsedResponse} />
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
};
