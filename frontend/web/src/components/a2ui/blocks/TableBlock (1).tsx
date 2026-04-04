import React from "react";
import { TableBlock } from "@/lib/a2ui-schema";

import { Grid3X3 } from "lucide-react";

interface TableResultProps {
  block: TableBlock;
}

export const TableResult: React.FC<TableResultProps> = ({ block }) => {
  return (
    <div className="my-6">
      <div className="flex items-center gap-2 mb-3">
        <Grid3X3 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        {block.title && (
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {block.title}
          </h3>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-700 uppercase bg-zinc-50 dark:bg-zinc-800/50 dark:text-zinc-300">
            <tr>
              {block.headers.map((header, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className="px-6 py-3 font-semibold tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
            {block.rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors"
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="px-6 py-4 text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap"
                  >
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
