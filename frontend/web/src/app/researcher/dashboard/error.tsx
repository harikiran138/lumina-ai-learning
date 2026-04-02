'use client';

import { DashboardError } from '@/components/shared/DashboardError';

export default function ResearcherDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DashboardError error={error} reset={reset} homeHref="/researcher/dashboard" roleName="Researcher" />;
}
