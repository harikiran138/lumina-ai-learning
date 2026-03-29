"use client";

import { cn } from "@/lib/utils";

interface AIQueueBadgeProps {
  count: number;
  className?: string;
}

export function AIQueueBadge({ count, className }: AIQueueBadgeProps) {
  if (count === 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full",
        "bg-red-500 text-white text-[10px] font-bold",
        "animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]",
        className,
      )}
      aria-label={`${count} pending AI answers`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
