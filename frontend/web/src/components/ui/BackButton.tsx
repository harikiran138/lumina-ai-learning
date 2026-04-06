"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

/**
 * Reusable BackButton component for Lumina AI.
 * Premium design with smooth hover effects and Lucide icon.
 */
export function BackButton({ href, label = "Back", className }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleBack}
      className={cn(
        "group flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-all duration-300 mb-6 w-fit",
        className
      )}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 group-hover:bg-lumina-primary group-hover:text-black group-hover:border-lumina-primary transition-all duration-300 shadow-lg shadow-black/20 group-hover:shadow-lumina-primary/20">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-300" />
      </div>
      <span className="opacity-80 group-hover:opacity-100 transition-opacity">
        {label}
      </span>
    </button>
  );
}
