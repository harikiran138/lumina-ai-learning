"use client";

import { Download, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

const buttonClasses =
  "inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10";

export function AdminRefreshButton({ label = "Refresh" }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={() => {
        router.refresh();
        toast.success("Admin data refreshed");
      }}
    >
      <RefreshCcw className="h-4 w-4" />
      {label}
    </button>
  );
}

export function AdminGhostButton({
  label,
  message,
  className,
}: {
  label: string;
  message: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(buttonClasses, className)}
      onClick={() => toast.success(message)}
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}

