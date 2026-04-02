'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `true` when the browser has a working network connection,
 * `false` when it is offline.
 *
 * Special Handling for Local Development:
 * If the application is being accessed via 'localhost' or '127.0.0.1', 
 * this hook will always return `true` to prevent distracting "Offline" 
 * banners when global internet connectivity is missing but the local 
 * dev server is clearly reachable.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    
    // Check if we are on localhost
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isLocalhost) return true;
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    // Re-check for localhost in the effect as well
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isLocalhost) {
      setIsOnline(true);
      return;
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync with actual state only if not on localhost
    if (!isLocalhost) {
      setIsOnline(navigator.onLine);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
