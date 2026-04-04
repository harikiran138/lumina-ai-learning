"use client";

import React, { useMemo } from "react";
import { type GraphBlock } from "@/lib/a2ui-schema";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface GraphResultProps {
  block: GraphBlock;
}

const DEFAULT_COLORS = ["#fbbf24", "#38bdf8", "#34d399", "#f87171", "#c084fc"];

export const GraphResult: React.FC<GraphResultProps> = ({ block }) => {
  const chartData = useMemo(() => {
    return block.content.labels.map((label, index) => {
      const row: Record<string, string | number> = { label };
      block.content.datasets.forEach((dataset, datasetIndex) => {
        row[dataset.label || `Series ${datasetIndex + 1}`] =
          dataset.data[index] ?? 0;
      });
      return row;
    });
  }, [block.content.datasets, block.content.labels]);

  const firstDataset = block.content.datasets[0];

  return (
    <div className="my-6 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-xl bg-cyan-400/10 p-2">
          <BarChart3 className="h-5 w-5 text-cyan-200" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">
            {block.content.title || "Graph"}
          </h3>
          {block.content.summary && (
            <p className="mt-1 text-sm text-slate-300">{block.content.summary}</p>
          )}
        </div>
      </div>

      <div className="h-72 rounded-2xl border border-white/8 bg-[#071019] p-4">
        <ResponsiveContainer width="100%" height="100%">
          {block.content.chartType === "bar" ? (
            <BarChart data={chartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020817",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "16px",
                  color: "#e2e8f0",
                }}
              />
              <Legend />
              {block.content.datasets.map((dataset, index) => (
                <Bar
                  key={`${dataset.label}-${index}`}
                  dataKey={dataset.label}
                  fill={dataset.color || dataset.borderColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                  radius={[8, 8, 0, 0]}
                />
              ))}
            </BarChart>
          ) : block.content.chartType === "pie" || block.content.chartType === "doughnut" ? (
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020817",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "16px",
                  color: "#e2e8f0",
                }}
              />
              <Legend />
              <Pie
                data={block.content.labels.map((label, index) => ({
                  name: label,
                  value: firstDataset?.data[index] ?? 0,
                }))}
                dataKey="value"
                nameKey="name"
                innerRadius={block.content.chartType === "doughnut" ? 55 : 0}
                outerRadius={90}
                paddingAngle={2}
              >
                {block.content.labels.map((label, index) => (
                  <Cell
                    key={`${label}-${index}`}
                    fill={
                      Array.isArray(firstDataset?.backgroundColor)
                        ? firstDataset.backgroundColor[index] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                        : firstDataset?.backgroundColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                    }
                  />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020817",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "16px",
                  color: "#e2e8f0",
                }}
              />
              <Legend />
              {block.content.datasets.map((dataset, index) => (
                <Line
                  key={`${dataset.label}-${index}`}
                  type="monotone"
                  dataKey={dataset.label}
                  stroke={dataset.color || dataset.borderColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {(block.content.xLabel || block.content.yLabel) && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.24em] text-slate-500">
          {block.content.xLabel && <span>X: {block.content.xLabel}</span>}
          {block.content.yLabel && <span>Y: {block.content.yLabel}</span>}
        </div>
      )}
    </div>
  );
};
