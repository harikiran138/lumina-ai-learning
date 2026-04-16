"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        suppressHydrationWarning
        className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        aria-label="Toggle Theme"
      >
        <div className="w-6 h-6" />
      </button>
    );
  }

  return (
    <button
      suppressHydrationWarning
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      aria-label="Toggle Theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="w-6 h-6" aria-hidden="true" />
      ) : (
        <Moon className="w-6 h-6" aria-hidden="true" />
      )}
    </button>
  );
}
