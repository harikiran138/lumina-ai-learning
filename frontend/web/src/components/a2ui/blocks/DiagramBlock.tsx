import React, { useEffect, useState } from "react";
import { DiagramBlock } from "@/lib/a2ui-schema";
import { Network } from "lucide-react";

// NOTE: In a real production app, we would dynamically import 'mermaid' here.
// For this "Core Brain Upgrade", we'll implement a clean container.
// If mermaid rendering is required immediately, we can add the dependency.

interface DiagramResultProps {
  block: DiagramBlock;
}

export const DiagramResult: React.FC<DiagramResultProps> = ({ block }) => {
  // Basic Mermaid initialization placeholder
  // useEffect(() => {
  //  if (block.diagram_type === 'mermaid') {
  //      mermaid.contentLoaded();
  //  }
  // }, [block.code]);

  return (
    <div className="my-6">
      <div className="flex items-center gap-2 mb-3">
        <Network className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        {block.title && (
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {block.title}
          </h3>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto flex justify-center">
        {block.diagram_type === "mermaid" ? (
          <div
            className="mermaid text-sm opacity-80"
            data-testid="mermaid-diagram"
          >
            {block.code}
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: block.code }} />
        )}
      </div>
      {block.caption && (
        <p className="text-center text-xs text-zinc-500 mt-2 italic">
          {block.caption}
        </p>
      )}
    </div>
  );
};
