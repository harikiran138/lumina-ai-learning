import { useState, useCallback, useRef } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Client-side cache hook for API responses
 * Implements stale-while-revalidate pattern
 */
export function useCache<T>(key: string, options: CacheOptions = {}) {
  const { ttl = DEFAULT_TTL, staleWhileRevalidate = true } = options;
  const cache = useRef<Map<string, CacheEntry<T>>>(new Map());
  const [isValidating, setIsValidating] = useState(false);

  const get = useCallback((): T | null => {
    const entry = cache.current.get(key);
    if (!entry) return null;

    const now = Date.now();

    // If expired and not using stale-while-revalidate, return null
    if (now > entry.expiresAt && !staleWhileRevalidate) {
      cache.current.delete(key);
      return null;
    }

    return entry.data;
  }, [key, staleWhileRevalidate]);

  const set = useCallback(
    (data: T) => {
      const now = Date.now();
      cache.current.set(key, {
        data,
        timestamp: now,
        expiresAt: now + ttl,
      });
    },
    [key, ttl],
  );

  const isStale = useCallback((): boolean => {
    const entry = cache.current.get(key);
    if (!entry) return true;
    return Date.now() > entry.expiresAt;
  }, [key]);

  const invalidate = useCallback(() => {
    cache.current.delete(key);
  }, [key]);

  const clear = useCallback(() => {
    cache.current.clear();
  }, []);

  return {
    get,
    set,
    isStale,
    invalidate,
    clear,
    isValidating,
    setIsValidating,
  };
}

/**
 * Request deduplication utility
 * Prevents multiple identical requests from being sent simultaneously
 */
class RequestDeduplicator {
  private pending: Map<string, Promise<any>> = new Map();

  async dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // If request is already pending, return the existing promise
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    // Create new request
    const promise = fetcher().finally(() => {
      // Clean up after request completes
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }

  clear() {
    this.pending.clear();
  }
}

export const requestDeduplicator = new RequestDeduplicator();

/**
 * Retry utility with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if (
        error instanceof Response &&
        error.status >= 400 &&
        error.status < 500
      ) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
