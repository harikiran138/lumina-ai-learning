import { useEffect, useState, useRef } from 'react';

/**
 * Returns `true` when the browser has a working network connection,
 * `false` when it is offline.
 *
 * Uses the browser's `navigator.onLine` API and listens for
 * `online`/`offline` window events.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  // Track the last stable state to avoid rapid flickering
  const lastStableRef = useRef(isOnline);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateStatus = (status: boolean) => {
      if (lastStableRef.current !== status) {
        lastStableRef.current = status;
        setIsOnline(status);
      }
    };

    const handleOnline = () => updateStatus(true);
    const handleOffline = () => updateStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
