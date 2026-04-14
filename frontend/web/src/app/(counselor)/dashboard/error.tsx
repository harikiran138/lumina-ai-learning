'use client';

import { DashboardError } from '@/components/shared/DashboardError';

export default function CounselorDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DashboardError error={error} reset={reset} homeHref="/counselor/dashboard" roleName="Counselor" />;
}
