'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser, clearAuth } = useAuthStore();
  const initAttempted = useRef(false);

  useEffect(() => {
    // Only attempt hydration once per mount if we don't have a user
    if (initAttempted.current || user) return;
    initAttempted.current = true;

    const hydrateAuth = async () => {
      try {
        const currentUser = await api.getCurrentUser();
        if (currentUser) {
          setUser(currentUser as any);
        } else {
          clearAuth();
        }
      } catch (err) {
        clearAuth();
      }
    };

    hydrateAuth();
  }, [user, setUser, clearAuth]);

  return <>{children}</>;
}
