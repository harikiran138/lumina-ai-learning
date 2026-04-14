'use client';

import { DashboardError } from '@/components/shared/DashboardError';

export default function ContentCreatorDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DashboardError error={error} reset={reset} homeHref="/content_creator/dashboard" roleName="Content Creator" />;
}
