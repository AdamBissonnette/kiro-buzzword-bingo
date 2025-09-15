/**
 * Performance monitoring and debugging utilities for React components
 */
import React from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  renderCount: number;
  lastRenderTimestamp: number;
  averageRenderTime: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private isEnabled: boolean = import.meta.env.DEV;

  /**
   * Start measuring render time for a component
   */
  startMeasure(componentName: string): () => void {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      this.recordMetric(componentName, renderTime);
    };
  }

  /**
   * Record a performance metric for a component
   */
  private recordMetric(componentName: string, renderTime: number): void {
    const existing = this.metrics.get(componentName);
    
    if (existing) {
      const newRenderCount = existing.renderCount + 1;
      const newAverageRenderTime = 
        (existing.averageRenderTime * existing.renderCount + renderTime) / newRenderCount;
      
      this.metrics.set(componentName, {
        componentName,
        renderTime,
        renderCount: newRenderCount,
        lastRenderTimestamp: Date.now(),
        averageRenderTime: newAverageRenderTime
      });
    } else {
      this.metrics.set(componentName, {
        componentName,
        renderTime,
        renderCount: 1,
        lastRenderTimestamp: Date.now(),
        averageRenderTime: renderTime
      });
    }

    // Log slow renders in development
    if (renderTime > 16) { // More than one frame at 60fps
      console.warn(
        `🐌 Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`
      );
    }
  }

  /**
   * Get performance metrics for a specific component
   */
  getMetrics(componentName: string): PerformanceMetrics | undefined {
    return this.metrics.get(componentName);
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Log performance summary to console
   */
  logSummary(): void {
    if (!this.isEnabled) return;

    const metrics = this.getAllMetrics();
    if (metrics.length === 0) {
      console.log('📊 No performance metrics recorded yet');
      return;
    }

    console.group('📊 Performance Summary');
    
    // Sort by average render time (slowest first)
    const sortedMetrics = metrics.sort((a, b) => b.averageRenderTime - a.averageRenderTime);
    
    sortedMetrics.forEach(metric => {
      const status = metric.averageRenderTime > 16 ? '🐌' : '⚡';
      console.log(
        `${status} ${metric.componentName}: ` +
        `${metric.averageRenderTime.toFixed(2)}ms avg ` +
        `(${metric.renderCount} renders, last: ${metric.renderTime.toFixed(2)}ms)`
      );
    });
    
    console.groupEnd();
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for measuring component render performance
 */
export function usePerformanceMonitor(componentName: string) {
  if (!import.meta.env.DEV) {
    return { startMeasure: () => () => {}, getMetrics: () => undefined };
  }

  const startMeasure = () => performanceMonitor.startMeasure(componentName);
  const getMetrics = () => performanceMonitor.getMetrics(componentName);

  return { startMeasure, getMetrics };
}

/**
 * Higher-order component for automatic performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const MonitoredComponent = React.memo((props: P) => {
    const { startMeasure } = usePerformanceMonitor(displayName);
    
    React.useLayoutEffect(() => {
      const endMeasure = startMeasure();
      return endMeasure;
    });

    return <WrappedComponent {...props} />;
  });

  MonitoredComponent.displayName = `withPerformanceMonitoring(${displayName})`;
  
  return MonitoredComponent;
}

/**
 * Utility to detect unnecessary re-renders
 */
export function useRenderTracker(componentName: string, props: Record<string, any>) {
  if (!import.meta.env.DEV) return;

  const prevProps = React.useRef<Record<string, any> | undefined>(undefined);
  const renderCount = React.useRef(0);

  React.useEffect(() => {
    renderCount.current += 1;
    
    if (prevProps.current) {
      const changedProps = Object.keys(props).filter(
        key => prevProps.current![key] !== props[key]
      );
      
      if (changedProps.length > 0) {
        console.log(
          `🔄 ${componentName} re-rendered (${renderCount.current}) due to:`,
          changedProps.reduce((acc, key) => {
            acc[key] = {
              from: prevProps.current![key],
              to: props[key]
            };
            return acc;
          }, {} as Record<string, any>)
        );
      } else {
        console.warn(
          `⚠️ ${componentName} re-rendered (${renderCount.current}) with no prop changes - check dependencies!`
        );
      }
    }
    
    prevProps.current = props;
  });
}

/**
 * Enhanced performance debugging utilities
 */
export function useComponentProfiler(componentName: string, props?: Record<string, any>) {
  if (!import.meta.env.DEV) return;

  const renderStartTime = React.useRef<number>(0);
  const prevProps = React.useRef<Record<string, any> | undefined>(undefined);

  // Track render start
  React.useLayoutEffect(() => {
    renderStartTime.current = performance.now();
  });

  // Track render end and analyze prop changes
  React.useLayoutEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    
    if (props && prevProps.current) {
      const changedProps = Object.keys(props).filter(
        key => prevProps.current![key] !== props[key]
      );
      
      if (changedProps.length > 0) {
        console.log(
          `🔄 ${componentName} re-rendered (${renderTime.toFixed(2)}ms) due to:`,
          changedProps.reduce((acc, key) => {
            acc[key] = {
              from: prevProps.current![key],
              to: props[key]
            };
            return acc;
          }, {} as Record<string, any>)
        );
      } else if (renderTime > 16) {
        console.warn(
          `⚠️ ${componentName} slow re-render (${renderTime.toFixed(2)}ms) with no prop changes - check dependencies!`
        );
      }
    }
    
    prevProps.current = props;
  });
}

/**
 * Hook to detect and warn about expensive operations during render
 */
export function useExpensiveOperationDetector(componentName: string) {
  if (!import.meta.env.DEV) return () => {};

  return (operationName: string, operation: () => any) => {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;
    
    if (duration > 5) {
      console.warn(
        `🐌 Expensive operation detected in ${componentName}: ${operationName} took ${duration.toFixed(2)}ms`
      );
    }
    
    return result;
  };
}

/**
 * Memory usage tracker for components
 */
export function useMemoryTracker(componentName: string) {
  if (!import.meta.env.DEV || !('memory' in performance)) return;

  const initialMemory = React.useRef<number>(0);

  React.useEffect(() => {
    if ('memory' in performance) {
      initialMemory.current = (performance as any).memory.usedJSHeapSize;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if ('memory' in performance) {
        const currentMemory = (performance as any).memory.usedJSHeapSize;
        const memoryDiff = currentMemory - initialMemory.current;
        
        if (Math.abs(memoryDiff) > 1024 * 1024) { // 1MB threshold
          console.log(
            `💾 ${componentName} memory impact: ${(memoryDiff / 1024 / 1024).toFixed(2)}MB`
          );
        }
      }
    };
  }, [componentName]);
}

// Make performance monitor available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).performanceMonitor = performanceMonitor;
  
  // Add global performance debugging commands
  (window as any).debugPerformance = {
    logSummary: () => performanceMonitor.logSummary(),
    clearMetrics: () => performanceMonitor.clearMetrics(),
    getAllMetrics: () => performanceMonitor.getAllMetrics(),
    enableProfiling: () => performanceMonitor.setEnabled(true),
    disableProfiling: () => performanceMonitor.setEnabled(false)
  };
}