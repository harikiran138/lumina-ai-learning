"use client";

import { Toaster } from "sonner";
import { useThemeMode } from "@/hooks/useThemeMode";

export function ThemedToaster() {
  const { mounted, isLight } = useThemeMode();

  return (
    <Toaster
      theme={mounted && isLight ? "light" : "dark"}
      richColors
      position="top-right"
    />
  );
}
