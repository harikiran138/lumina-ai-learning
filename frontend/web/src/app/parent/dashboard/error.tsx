'use client';

import { DashboardError } from '@/components/shared/DashboardError';

export default function ParentDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DashboardError error={error} reset={reset} homeHref="/parent/dashboard" roleName="Parent" />;
}
