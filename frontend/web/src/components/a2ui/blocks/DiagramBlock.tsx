"use client";

import React, { useEffect, useId, useState } from "react";
import { type DiagramBlock } from "@/lib/a2ui-schema";
import { Network } from "lucide-react";

interface DiagramResultProps {
  block: DiagramBlock;
}

function sanitizeMermaid(code: string) {
  let sanitized = code.replace(
    /(\w+)\(([^")]*?\([^")]*?\)[^")]*?)\)/g,
    '$1("$2")',
  );
  sanitized = sanitized.replace(
    /(\w+)\[([^"]*?\[[^"]*?\][^"]*?)\]/g,
    '$1["$2"]',
  );
  return sanitized;
}

/** Strip event handlers and <script> tags from Mermaid-rendered SVG before dangerouslySetInnerHTML. */
function sanitizeSvg(svgContent: string): string {
  return svgContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/\s+on\w+='[^']*'/gi, "")
    .replace(/javascript:[^"'\s]*/gi, "");
}

export const DiagramResult: React.FC<DiagramResultProps> = ({ block }) => {
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);
  const diagramId = useId().replace(/:/g, "");

  useEffect(() => {
    if (block.content.diagramType === "svg") {
      setSvg(sanitizeSvg(block.content.code));
      setFailed(false);
      return;
    }

    let cancelled = false;

    const renderMermaid = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "strict",
        });

        const { svg: renderedSvg } = await mermaid.render(
          `a2ui-diagram-${diagramId}`,
          sanitizeMermaid(block.content.code),
        );

        if (!cancelled) {
          setSvg(sanitizeSvg(renderedSvg));
          setFailed(false);
        }
      } catch (error) {
        console.error("diagram_render_failed", error);
        if (!cancelled) {
          setSvg("");
          setFailed(true);
        }
      }
    };

    renderMermaid();

    return () => {
      cancelled = true;
    };
  }, [block.content.code, block.content.diagramType, diagramId]);

  return (
    <div className="my-6 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2">
        <Network className="h-5 w-5 text-sky-300" />
        {block.content.title && (
          <h3 className="font-semibold text-white">{block.content.title}</h3>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/6 bg-[#08111f] p-4">
        {svg ? (
          <div
            className="flex justify-center"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : failed ? (
          <pre className="whitespace-pre-wrap text-xs text-red-200">
            {block.content.code}
          </pre>
        ) : (
          <div className="text-sm text-slate-400">Rendering diagram...</div>
        )}
      </div>

      {block.content.caption && (
        <p className="mt-2 text-xs italic text-slate-400">
          {block.content.caption}
        </p>
      )}
    </div>
  );
};
