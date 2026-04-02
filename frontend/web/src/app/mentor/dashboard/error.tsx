'use client';

import { DashboardError } from '@/components/shared/DashboardError';

export default function MentorDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DashboardError error={error} reset={reset} homeHref="/mentor/dashboard" roleName="Mentor" />;
}
