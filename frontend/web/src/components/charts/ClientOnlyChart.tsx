"use client";

import React, { useEffect, useState } from "react";

type ClientOnlyChartProps = {
  children: React.ReactNode;
  fallbackClassName?: string;
};

export function ClientOnlyChart({
  children,
  fallbackClassName = "h-full w-full rounded-2xl bg-white/5",
}: ClientOnlyChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div aria-hidden="true" className={fallbackClassName} />;
  }

  return <>{children}</>;
}
