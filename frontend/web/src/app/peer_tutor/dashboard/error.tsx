'use client';

import { DashboardError } from '@/components/shared/DashboardError';

export default function PeerTutorDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DashboardError error={error} reset={reset} homeHref="/peer_tutor/dashboard" roleName="Peer Tutor" />;
}
