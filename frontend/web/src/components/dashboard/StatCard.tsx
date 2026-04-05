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
    gold: "text-lumina-highlight bg-lumina-highlight/10",
    amber: "text-amber-400 bg-amber-500/10",
    blue: "text-amber-400 bg-amber-500/10",
    green: "text-yellow-400 bg-yellow-500/10",
    purple: "text-amber-400 bg-amber-500/10",
    default: "text-gray-400 bg-white/5",
  };

  return (
    <div
      className={cn(
        "glass-onyx p-6 rounded-[2rem] relative overflow-hidden group transition-all duration-500 hover:border-lumina-highlight/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.05)]",
        className,
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="relative z-10 w-full flex flex-col gap-2">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em] opacity-80 group-hover:text-lumina-highlight/60 transition-colors">
            {title}
          </p>
          <div className="flex items-baseline gap-3">
            <h3 className="text-4xl lg:text-5xl font-display font-bold text-white tracking-tight group-hover:text-glow-gold transition-all duration-500">
              {value}
            </h3>
            {trend && (
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border backdrop-blur-sm",
                  trend.isPositive
                    ? "text-lumina-highlight bg-lumina-highlight/10 border-lumina-highlight/20"
                    : "text-red-400 bg-red-400/10 border-red-400/20",
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
        </div>
        <div
          className={cn(
            "p-4 rounded-2xl transition-all group-hover:scale-110 group-hover:rotate-6 duration-700 relative z-10 backdrop-blur-md border border-white/5 shadow-xl",
            colorStyles[color],
          )}
        >
          <Icon className="w-6 h-6 group-hover:animate-pulse" />
        </div>
      </div>
      {subtitle && (
        <p className="text-[10px] text-gray-400/60 font-black uppercase tracking-widest relative z-10 mt-2">
          {subtitle}
        </p>
      )}

      {/* Modern Gradient Background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-lumina-highlight/[0.08] to-transparent rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none transition-all duration-700 group-hover:opacity-100 group-hover:scale-125" />
    </div>
  );
}

