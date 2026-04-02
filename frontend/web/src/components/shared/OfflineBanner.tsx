'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

/**
 * OfflineBanner
 * -------------
 * Renders a sticky top banner when the browser loses its network connection.
 * The banner disappears automatically once connectivity is restored.
 *
 * Usage: mount once inside the root layout (e.g. `app/layout.tsx`):
 *
 *   import { OfflineBanner } from '@/components/shared/OfflineBanner';
 *   ...
 *   <OfflineBanner />
 *   {children}
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 inset-x-0 z-[9999] flex items-center justify-center gap-2
                 bg-amber-500 text-black text-sm font-semibold px-4 py-2 shadow-lg"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>You are offline. Some features may be unavailable until connectivity is restored.</span>
    </div>
  );
}
