import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function formatCompactNumber(value?: number | null) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(
    Number(value || 0),
  );
}

export function formatPercent(value?: number | null) {
  return `${Math.round(Number(value || 0))}%`;
}

export function formatDateTime(value?: string | null) {
  if (!value) return "No recent activity";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No recent activity";
  return parsed.toLocaleString();
}

export function getToneClasses(tone?: string) {
  if (tone === "high" || tone === "critical" || tone === "error") {
    return "border-red-400/20 bg-red-500/10 text-red-200";
  }
  if (tone === "medium" || tone === "watch" || tone === "warning") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-100";
  }
  if (tone === "success" || tone === "healthy" || tone === "low") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }
  return "border-white/10 bg-white/5 text-gray-100";
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300/80">
          {eyebrow}
        </p>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-amber-300">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {title}
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-300 sm:text-base">
              {description}
            </p>
          </div>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}

export function AdminPanel({
  title,
  description,
  children,
  className,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("glass-v2 overflow-hidden border-white/5", className)}>
      <div className="flex flex-col gap-3 border-b border-white/5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-gray-400">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export function AdminStatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: string;
}) {
  return (
    <article
      className={cn(
        "glass-v2 border-white/5 p-5",
        tone === "highlight" ? "bg-amber-500/[0.08]" : "",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">
          {label}
        </p>
        <div className="rounded-xl bg-white/5 p-2 text-amber-300">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-gray-400">{helper}</p>
    </article>
  );
}

export function AdminStatusBadge({
  label,
  tone,
}: {
  label: string;
  tone?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        getToneClasses(tone),
      )}
    >
      {label}
    </span>
  );
}

export function AdminEmptyState({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 px-6 py-14 text-center">
      <div className="rounded-full bg-white/5 p-4 text-gray-400">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-xl text-sm text-gray-400">{description}</p>
      {href && actionLabel ? (
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="skeleton h-4 w-28" />
        <div className="skeleton h-10 w-80" />
        <div className="skeleton h-5 w-full max-w-2xl" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="skeleton h-36 w-full rounded-3xl border border-white/5"
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="skeleton h-[340px] w-full rounded-3xl border border-white/5" />
        <div className="space-y-6">
          <div className="skeleton h-[160px] w-full rounded-3xl border border-white/5" />
          <div className="skeleton h-[160px] w-full rounded-3xl border border-white/5" />
        </div>
      </div>
    </div>
  );
}

