import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Debounced resize hook for better mobile performance
 */
export function useDebounce<T>(value: T, delay: number): T {
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
 * Optimized resize observer hook with debouncing
 */
export function useResponsive() {
  const [dimensions, setDimensions] = useState({
    isMobile: window.innerWidth < 640,
    isTablet: window.innerWidth >= 640 && window.innerWidth < 1024,
    width: window.innerWidth,
  });

  useEffect(() => {
    // FIX: Use ReturnType<typeof setTimeout> for browser compatibility instead of NodeJS.Timeout.
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      // Debounce resize events
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        setDimensions({
          isMobile: width < 640,
          isTablet: width >= 640 && width < 1024,
          width,
        });
      }, 150); // 150ms debounce
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return dimensions;
}

/**
 * Throttled callback hook for high-frequency events
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRan = useRef(Date.now());
  // FIX: Use ReturnType<typeof setTimeout> which is browser-safe, instead of NodeJS.Timeout.
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // FIX: Refactored for clarity and to ensure type safety.
  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRan.current = Date.now();
        }, delay - (now - lastRan.current));
      }
    },
    [callback, delay]
  );

  return throttledCallback as T;
}
