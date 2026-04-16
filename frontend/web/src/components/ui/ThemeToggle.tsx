"use client";

import { useThemeMode } from "@/hooks/useThemeMode";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { mounted, isDark, toggleTheme } = useThemeMode();

  if (!mounted) {
    return (
      <button
        suppressHydrationWarning
        className="p-2 rounded-lg text-text-secondary hover:bg-surface hover:text-text transition-colors"
        aria-label="Toggle Theme"
      >
        <div className="w-6 h-6" />
      </button>
    );
  }

  return (
    <button
      suppressHydrationWarning
      onClick={toggleTheme}
      className="p-2 rounded-lg text-text-secondary hover:bg-surface hover:text-text transition-colors"
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="w-6 h-6" aria-hidden="true" />
      ) : (
        <Moon className="w-6 h-6" aria-hidden="true" />
      )}
    </button>
  );
}
