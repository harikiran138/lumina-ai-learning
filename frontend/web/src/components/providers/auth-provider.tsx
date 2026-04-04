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

    const hydrateAuth = async () => {
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
      const hasClientSession =
        typeof document !== 'undefined' &&
        (document.cookie.includes('access_token=') || document.cookie.includes('refresh_token='));

      if (isAuthPage && !hasClientSession) {
        clearAuth();
        return;
      }

      // isLoading is already true (set by onRehydrateStorage + initial value).
      // Explicitly set it so the promise start is synchronous.
      setLoading(true);
      try {
        const currentUser = await api.getCurrentUser();
        if (currentUser) {
          setUser(currentUser as any);
        } else {
          // No valid session on the backend → clear any stale local state.
          clearAuth();
        }
      } catch {
        // Network error or 401 → treat as unauthenticated.
        clearAuth();
      }
      // isLoading is set to false by both setUser and clearAuth.
    };

    hydrateAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run exactly once on mount — deps are stable store actions

  return <>{children}</>;
}
