"use client";

import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

export function useThemeMode() {
  const { theme, resolvedTheme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;
  const isLight = mounted ? resolvedTheme === "light" : false;

  const toggleTheme = useMemo(
    () => () => {
      setTheme(isDark ? "light" : "dark");
    },
    [isDark, setTheme],
  );

  return {
    mounted,
    theme,
    resolvedTheme,
    systemTheme,
    setTheme,
    toggleTheme,
    isDark,
    isLight,
  };
}
