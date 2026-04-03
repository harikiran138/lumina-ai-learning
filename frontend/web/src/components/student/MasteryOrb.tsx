"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface MasteryOrbProps {
  progress: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MasteryOrb({
  progress,
  label = "Total Mastery",
  size = "md",
  className,
}: MasteryOrbProps) {
  const sizeClasses = {
    sm: "w-32 h-32",
    md: "w-48 h-48",
    lg: "w-64 h-64",
  };

  const ringStyles = {
    strokeDasharray: "283",
    strokeDashoffset: (283 - (progress / 100) * 283).toString(),
  };

  return (
    <div className={cn("relative flex flex-col items-center justify-center", className)}>
      <div className={cn("relative group", sizeClasses[size])}>
        {/* Glow Effects */}
        <div className="absolute inset-0 bg-lumina-primary/20 rounded-full blur-3xl group-hover:bg-lumina-highlight/20 transition-all duration-700" />
        <div className="absolute inset-4 bg-lumina-accent/10 rounded-full blur-2xl animate-pulse" />
        
        {/* SVG Container */}
        <svg className="w-full h-full transform -rotate-90 relative z-10 transition-transform duration-700 group-hover:scale-105">
          {/* Background Ring */}
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            className="stroke-white/[0.03] fill-none"
            strokeWidth="8"
          />
          {/* Progress Ring (Secondary Gradient) */}
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            className="stroke-lumina-primary/30 fill-none"
            strokeWidth="8"
            style={ringStyles}
            strokeLinecap="round"
          />
          {/* Main Progress Ring (Highlight) */}
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            className="stroke-lumina-highlight fill-none transition-all duration-1000 ease-out"
            strokeWidth="4"
            style={ringStyles}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <div className="relative">
            <span className="text-4xl lg:text-5xl font-black text-white font-display tracking-tight">
              {progress}%
            </span>
            <Sparkles className="absolute -top-6 -right-6 w-5 h-5 text-lumina-highlight animate-float opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">
            {label}
          </span>
        </div>
      </div>

      {/* Stats Below (Optional/Context Dependent) */}
      <div className="mt-8 flex gap-6">
        <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Knowledge</p>
            <p className="text-white font-black">Stable</p>
        </div>
        <div className="w-px h-8 bg-white/5" />
        <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">DKT Engine</p>
            <p className="text-lumina-highlight font-black">Active</p>
        </div>
      </div>
    </div>
  );
}
