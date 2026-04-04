"use client";

import React from "react";
import { type TableBlock } from "@/lib/a2ui-schema";
import { Grid3X3 } from "lucide-react";

interface TableResultProps {
  block: TableBlock;
}

export const TableResult: React.FC<TableResultProps> = ({ block }) => {
  return (
    <div className="my-6 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2">
        <Grid3X3 className="h-5 w-5 text-slate-300" />
        {block.content.title && (
          <h3 className="font-semibold text-white">{block.content.title}</h3>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/8">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.2em] text-slate-300">
            <tr>
              {block.content.headers.map((header, index) => (
                <th key={`${header}-${index}`} className="px-4 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6 bg-black/10 text-slate-200">
            {block.content.rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`cell-${rowIndex}-${cellIndex}`} className="px-4 py-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
