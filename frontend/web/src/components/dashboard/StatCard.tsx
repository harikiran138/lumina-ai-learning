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
    gold: "text-lumina-primary bg-lumina-primary/10",
    blue: "text-blue-400 bg-blue-500/10",
    green: "text-emerald-400 bg-emerald-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    default: "text-gray-400 bg-white/5",
  };

  return (
    <div
      className={cn("glass-card p-6 relative overflow-hidden group", className)}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-white tracking-tight">
              {value}
            </h3>
            {trend && (
              <span
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  trend.isPositive
                    ? "text-emerald-400 bg-emerald-400/10"
                    : "text-red-400 bg-red-400/10",
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
        </div>
        <div
          className={cn(
            "p-3 rounded-xl transition-transform group-hover:scale-110 duration-300",
            colorStyles[color],
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
      )}

      {/* Decorative Gradient Blob */}
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl group-hover:bg-white/10 transition-colors duration-500" />
    </div>
  );
}
