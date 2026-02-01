/**
 * Frontend Performance Optimization Utilities
 * Includes debouncing, memoization, and lazy loading helpers.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Debounce hook - delays execution until after wait milliseconds of inactivity
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced callback hook
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  return useCallback(
    ((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay],
  );
}

/**
 * Throttle hook - limits execution to once per wait milliseconds
 */
export function useThrottle<T>(value: T, limit: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(
      () => {
        if (Date.now() - lastRan.current >= limit) {
          setThrottledValue(value);
          lastRan.current = Date.now();
        }
      },
      limit - (Date.now() - lastRan.current),
    );

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * Optimized fetch hook with caching and deduplication
 */
interface FetchOptions {
  cache?: boolean;
  cacheDuration?: number; // milliseconds
  deduplicate?: boolean;
}

const fetchCache = new Map<string, { data: any; timestamp: number }>();
const pendingRequests = new Map<string, Promise<any>>();

export function useOptimizedFetch<T>(
  url: string | null,
  options: FetchOptions = {},
) {
  const {
    cache = true,
    cacheDuration = 5 * 60 * 1000, // 5 minutes
    deduplicate = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;

    // Check cache
    if (cache) {
      const cached = fetchCache.get(url);
      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        setData(cached.data);
        return;
      }
    }

    // Check for pending request (deduplication)
    if (deduplicate && pendingRequests.has(url)) {
      try {
        const result = await pendingRequests.get(url);
        setData(result);
        return;
      } catch (err) {
        setError(err as Error);
        return;
      }
    }

    setLoading(true);
    setError(null);

    const fetchPromise = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((result) => {
        setData(result);
        if (cache) {
          fetchCache.set(url, { data: result, timestamp: Date.now() });
        }
        return result;
      })
      .catch((err) => {
        setError(err);
        throw err;
      })
      .finally(() => {
        setLoading(false);
        pendingRequests.delete(url);
      });

    if (deduplicate) {
      pendingRequests.set(url, fetchPromise);
    }

    await fetchPromise;
  }, [url, cache, cacheDuration, deduplicate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {},
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

/**
 * Memoization helper for expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  maxSize: number = 100,
): T {
  const cache = new Map<string, ReturnType<T>>();
  const keys: string[] = [];

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    keys.push(key);

    // Evict oldest if cache is full
    if (keys.length > maxSize) {
      const oldest = keys.shift()!;
      cache.delete(oldest);
    }

    return result;
  }) as T;
}

/**
 * Local storage hook with automatic JSON serialization
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
      }
    },
    [key],
  );

  return [storedValue, setValue];
}

/**
 * Batch state updates to reduce re-renders
 */
export function useBatchedState<T>(
  initialState: T,
  batchDelay: number = 50,
): [T, (updater: (prev: T) => T) => void] {
  const [state, setState] = useState(initialState);
  const pendingUpdates = useRef<Array<(prev: T) => T>>([]);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const batchedSetState = useCallback(
    (updater: (prev: T) => T) => {
      pendingUpdates.current.push(updater);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setState((prev) => {
          let next = prev;
          for (const update of pendingUpdates.current) {
            next = update(next);
          }
          pendingUpdates.current = [];
          return next;
        });
      }, batchDelay);
    },
    [batchDelay],
  );

  return [state, batchedSetState];
}

/**
 * Clear all fetch caches
 */
export function clearFetchCache() {
  fetchCache.clear();
  pendingRequests.clear();
}

/**
 * Preload data for a URL
 */
export async function preloadData(url: string) {
  if (fetchCache.has(url)) return;

  try {
    const response = await fetch(url);
    const data = await response.json();
    fetchCache.set(url, { data, timestamp: Date.now() });
  } catch (error) {
    console.error(`Error preloading ${url}:`, error);
  }
}
