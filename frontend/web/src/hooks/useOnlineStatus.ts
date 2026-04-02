'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `true` when the browser has a working network connection,
 * `false` when it is offline.
 *
 * The value updates automatically whenever the browser fires `online` /
 * `offline` events, so components re-render without any extra polling.
 *
 * During server-side rendering the hook always returns `true` so that
 * the offline banner does not flash on initial load.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync with actual state in case it changed before the listeners attached.
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
