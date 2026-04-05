'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';

/**
 * AuthProvider — mounted ONCE in the root layout wrapping all children.
 *
 * On every mount it validates the current session against the backend
 * (using the HTTP-only cookie). This ensures:
 *
 *  1. After a page refresh the user object is restored even in new tabs
 *     (since localStorage may be stale or empty).
 *  2. A revoked/expired cookie clears the store immediately — no infinite
 *     redirect loop because isLoading stays true until resolution.
 *  3. isLoading is set to `true` before the async call and `false` after,
 *     so dashboard layouts can gate render until auth is confirmed.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, clearAuth, setLoading } = useAuthStore();
  const initAttempted = useRef(false);

  useEffect(() => {
    // Prevent double-hydration in React Strict Mode (two mounts in dev)
    if (initAttempted.current) return;
    initAttempted.current = true;

    const hydrateAuth = async (retries = 3) => {
      // Guard against race conditions if multiple useEffects trigger (dev mode/fast refresh)
      if ((window as any).__LUMINA_AUTH_HYDRATING__) return;
      (window as any).__LUMINA_AUTH_HYDRATING__ = true;

      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
      const hasClientSession =
        typeof document !== 'undefined' &&
        (document.cookie.includes('access_token=') || document.cookie.includes('refresh_token='));

      if (isAuthPage && !hasClientSession) {
        clearAuth();
        (window as any).__LUMINA_AUTH_HYDRATING__ = false;
        return;
      }

      setLoading(true);

      // Delay hydration slightly to let backend/network stabilize on mount
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        const currentUser = await api.getCurrentUser();
        if (currentUser) {
          setUser(currentUser as any);
          console.log('[Lumina Auth] Session hydrated successfully.');
        } else {
          console.warn('[Lumina Auth] No valid session on backend. Clearing.');
          clearAuth();
          if (!isAuthPage) window.location.href = '/login';
        }
      } catch (err: any) {
        const isNetworkError = err.message?.includes('fetch') || err.message?.includes('Network') || !window.navigator.onLine;

        if (isNetworkError && retries > 0) {
          console.warn(`[Lumina Auth] Hydration fetch failed. Retrying... (${retries} left)`);
          (window as any).__LUMINA_AUTH_HYDRATING__ = false;
          return hydrateAuth(retries - 1);
        }

        if (isNetworkError) {
          // [Lumina Resilience] If it's pure network failure after retries, 
          // we DO NOT clearAuth. We keep the stored session optimistically.
          console.error('[Lumina Auth] Persistent network failure. Keeping local session state.');
        } else {
          // Only clear if it's a real Auth error (like a 401 decoded by getCurrentUser)
          console.error('[Lumina Auth] Hydration failed with non-network error:', err.message);
          clearAuth();
          if (!isAuthPage) {
             console.error('[Lumina Auth] Redirecting to login.');
             window.location.href = '/login';
          }
        }
      } finally {
        (window as any).__LUMINA_AUTH_HYDRATING__ = false;
        setLoading(false);
      }
    };

    hydrateAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run exactly once on mount — deps are stable store actions

  return <>{children}</>;
}
