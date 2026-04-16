import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  color?: "gold" | "amber" | "green" | "purple" | "default";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  color = "default",
}: StatCardProps) {
  const colorStyles: Record<string, string> = {
    gold: "text-primary bg-primary/10",
    amber: "text-accent bg-accent/10",
    blue: "text-blue-500 bg-blue-500/10",
    green: "text-primary bg-primary/10",
    purple: "text-purple-500 bg-purple-500/10",
    default: "text-text-secondary bg-surface-elevated",
  };

  return (
    <div
      className={cn(
        "bg-surface-elevated border border-border p-6 rounded-[2rem] relative overflow-hidden group transition-all duration-500 hover:border-primary/30 hover:shadow-lg dark:hover:shadow-primary/5 shadow-sm",
        className,
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="relative z-10 w-full flex flex-col gap-2">
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.25em] opacity-80 group-hover:text-primary/60 transition-colors">
            {title}
          </p>
          <div className="flex items-baseline gap-3">
            <h3 className="text-4xl lg:text-5xl font-display font-bold text-text tracking-tight transition-all duration-500">
              {value}
            </h3>
            {trend && (
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border",
                  trend.isPositive
                    ? "text-primary bg-primary/10 border-primary/20"
                    : "text-red-500 bg-red-500/10 border-red-500/20",
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
        </div>
        <div
          className={cn(
            "p-4 rounded-2xl transition-all group-hover:scale-110 group-hover:rotate-6 duration-700 relative z-10 border border-border shadow-md dark:shadow-xl",
            colorStyles[color],
          )}
        >
          <Icon className="w-6 h-6 group-hover:animate-pulse" />
        </div>
      </div>
      {subtitle && (
        <p className="text-[10px] text-text-muted font-black uppercase tracking-widest relative z-10 mt-2">
          {subtitle}
        </p>
      )}

      {/* Modern Gradient Background - Only in Dark mode or very subtle */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none transition-all duration-700 group-hover:opacity-100 group-hover:scale-125 dark:block hidden" />
    </div>
  );
}

