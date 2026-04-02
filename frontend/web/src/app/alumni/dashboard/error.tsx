'use client';

import { DashboardError } from '@/components/shared/DashboardError';

export default function AlumniDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DashboardError error={error} reset={reset} homeHref="/alumni/dashboard" roleName="Alumni" />;
}
