/**
 * Performance optimization utilities for React components
 */
import { useCallback, useRef, useMemo } from 'react';

/**
 * Debounced state update hook to prevent excessive re-renders
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T {
  const timeoutRef = useRef<number | null>(null);
  
  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay, ...deps]
  );
}

/**
 * Throttled callback hook to limit function execution frequency
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);
  
  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;
      
      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    }) as T,
    [callback, delay, ...deps]
  );
}

/**
 * Memoized deep comparison hook for complex objects
 */
export function useDeepMemo<T>(factory: () => T, deps: React.DependencyList): T {
  const ref = useRef<{ deps: React.DependencyList; value: T } | undefined>(undefined);
  
  if (!ref.current || !areDeepEqual(ref.current.deps, deps)) {
    ref.current = {
      deps,
      value: factory()
    };
  }
  
  return ref.current.value;
}

/**
 * Deep equality comparison for dependency arrays
 */
function areDeepEqual(a: React.DependencyList, b: React.DependencyList): boolean {
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) {
      // For objects and arrays, do a shallow comparison
      if (typeof a[i] === 'object' && typeof b[i] === 'object' && a[i] !== null && b[i] !== null) {
        const aKeys = Object.keys(a[i] as object);
        const bKeys = Object.keys(b[i] as object);
        
        if (aKeys.length !== bKeys.length) return false;
        
        for (const key of aKeys) {
          if (!Object.is((a[i] as any)[key], (b[i] as any)[key])) {
            return false;
          }
        }
      } else {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Optimized state batch update hook
 */
export function useBatchedUpdates() {
  const pendingUpdatesRef = useRef<(() => void)[]>([]);
  const timeoutRef = useRef<number | null>(null);
  
  const batchUpdate = useCallback((updateFn: () => void) => {
    pendingUpdatesRef.current.push(updateFn);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      const updates = pendingUpdatesRef.current;
      pendingUpdatesRef.current = [];
      
      // Execute all pending updates in a single batch
      updates.forEach(update => update());
    }, 0);
  }, []);
  
  return batchUpdate;
}

/**
 * Memoized selector hook for extracting specific values from complex state
 */
export function useSelector<TState, TSelected>(
  state: TState,
  selector: (state: TState) => TSelected,
  equalityFn?: (a: TSelected, b: TSelected) => boolean
): TSelected {
  const selectedRef = useRef<TSelected | undefined>(undefined);
  const selectorRef = useRef(selector);
  const equalityRef = useRef(equalityFn);
  
  // Update refs if they change
  selectorRef.current = selector;
  equalityRef.current = equalityFn;
  
  return useMemo(() => {
    const newSelected = selectorRef.current(state);
    
    if (selectedRef.current === undefined) {
      selectedRef.current = newSelected;
      return newSelected;
    }
    
    const areEqual = equalityRef.current 
      ? equalityRef.current(selectedRef.current, newSelected)
      : Object.is(selectedRef.current, newSelected);
    
    if (!areEqual) {
      selectedRef.current = newSelected;
    }
    
    return selectedRef.current;
  }, [state]);
}

/**
 * Performance-optimized list rendering hook
 */
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const totalCount = items.length;
    
    return {
      totalHeight: totalCount * itemHeight,
      visibleCount,
      getVisibleItems: (scrollTop: number) => {
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        const endIndex = Math.min(totalCount, startIndex + visibleCount + overscan * 2);
        
        return {
          startIndex,
          endIndex,
          items: items.slice(startIndex, endIndex),
          offsetY: startIndex * itemHeight
        };
      }
    };
  }, [items, itemHeight, containerHeight, overscan]);
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  const observe = useCallback((element: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    if (element) {
      targetRef.current = element;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Element is visible
              element.setAttribute('data-visible', 'true');
            } else {
              element.setAttribute('data-visible', 'false');
            }
          });
        },
        options
      );
      
      observerRef.current.observe(element);
    }
  }, [options]);
  
  return { observe, targetRef };
}

/**
 * Optimized event handler hook that prevents unnecessary re-renders
 */
export function useStableCallback<T extends (...args: any[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  return useCallback(
    ((...args: Parameters<T>) => {
      return callbackRef.current(...args);
    }) as T,
    []
  );
}