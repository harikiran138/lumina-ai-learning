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
  color?: "gold" | "blue" | "green" | "purple" | "default";
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
  const colorStyles = {
    gold: "text-lumina-highlight bg-lumina-highlight/10",
    blue: "text-blue-400 bg-blue-500/10",
    green: "text-emerald-400 bg-emerald-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    default: "text-gray-400 bg-white/5",
  };

  return (
    <div
      className={cn(
        color === "gold" ? "glass-v2-gold" : "glass-v2",
        "p-6 relative overflow-hidden group",
        className,
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="relative z-10">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-2 opacity-80">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-display font-bold text-white tracking-tight">
              {value}
            </h3>
            {trend && (
              <span
                className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-md",
                  trend.isPositive
                    ? "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20"
                    : "text-red-400 bg-red-400/10 border border-red-400/20",
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
        </div>
        <div
          className={cn(
            "p-3 rounded-xl transition-all group-hover:scale-110 group-hover:rotate-6 duration-500 relative z-10",
            colorStyles[color],
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {subtitle && (
        <p className="text-xs text-gray-400/60 font-medium relative z-10">
          {subtitle}
        </p>
      )}

      {/* Modern Gradient Background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/[0.03] to-transparent rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
    </div>
  );
}
