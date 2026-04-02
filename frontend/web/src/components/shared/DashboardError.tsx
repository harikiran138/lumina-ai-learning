'use client';

import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref: string;
  roleName: string;
}

/**
 * Shared error UI for role dashboard error boundaries.
 * Each role's `error.tsx` passes its home route and display name.
 */
export function DashboardError({ error, reset, homeHref, roleName }: DashboardErrorProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
          <AlertCircle className="h-7 w-7 text-red-400" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">
            {roleName} Dashboard Error
          </h2>
          <p className="text-sm text-gray-400">
            Something went wrong while loading your dashboard. This may be a
            temporary issue — please try again.
          </p>
          {error?.digest && (
            <p className="font-mono text-xs text-gray-600">
              Error ref: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl
                       bg-white/10 px-5 py-2.5 text-sm font-semibold text-white
                       transition-colors hover:bg-white/20 focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>

          <Link
            href={homeHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl
                       border border-white/10 px-5 py-2.5 text-sm font-semibold
                       text-gray-300 transition-colors hover:border-white/30
                       hover:text-white focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
