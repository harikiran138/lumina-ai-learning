import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  score: number; // 0–100
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function RiskBadge({ score, showLabel = true, size = "md", className }: RiskBadgeProps) {
  const level = score < 40 ? "low" : score < 70 ? "medium" : "high";
  const cfg = {
    low:    { label: "Low Risk",    bar: "bg-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
    medium: { label: "Medium Risk", bar: "bg-amber-500",   text: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30"   },
    high:   { label: "High Risk",   bar: "bg-red-500",     text: "text-red-400",     bg: "bg-red-500/10 border-red-500/30"      },
  }[level];

  if (size === "sm") {
    return (
      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold", cfg.bg, cfg.text, className)}>
        <span className={cn("w-1.5 h-1.5 rounded-full", cfg.bar)} />
        {showLabel ? cfg.label : `${score}%`}
      </span>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-semibold", cfg.text)}>{cfg.label}</span>
        <span className={cn("text-xs font-mono", cfg.text)}>{score}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden w-full">
        <div className={cn("h-full rounded-full transition-all", cfg.bar)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
