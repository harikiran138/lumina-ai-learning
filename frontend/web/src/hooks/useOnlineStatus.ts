import { useEffect, useState, useRef } from 'react';

/**
 * Returns `true` when the browser has a working network connection,
 * `false` when it is offline.
 *
 * Special Handling for Local Development:
 * If the application is being accessed via 'localhost' or '127.0.0.1', 
 * this hook will always return `true` to avoid "Offline" banners 
 * during local development when internet/VPN might be disconnected.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  // Track the last stable state to avoid rapid flickering
  const lastStableRef = useRef(isOnline);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isLocalhost) {
      setIsOnline(true);
      return;
    }

    const updateStatus = (status: boolean) => {
      if (lastStableRef.current !== status) {
        lastStableRef.current = status;
        setIsOnline(status);
      }
    };

    const verifyBackend = async () => {
      try {
        // Use a relative path to the health endpoint
        // This ensures it works regardless of which proxy/base path is used
        const response = await fetch('/api/health', { 
          method: 'HEAD', // Lightest possible check
          cache: 'no-store'
        });

        // ✅ Server reachable → ONLINE (even if 500, we have network connectivity)
        if (response.status >= 200 && response.status < 600) {
          updateStatus(true);
        }
      } catch (error) {
        // ❌ Only here it's truly offline (network error or timeout)
        // We only set offline if the browser also reports offline to be safe
        if (navigator.onLine === false) {
          updateStatus(false);
        }
      }
    };

    const handleOnline = () => {
      updateStatus(true);
      verifyBackend();
    };
    
    const handleOffline = () => {
      updateStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    verifyBackend();

    // Periodically re-verify every 30s
    const checkInterval = setInterval(verifyBackend, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(checkInterval);
    };
  }, []);

  return isOnline;
}
