import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { performanceMonitor } from '../../utils/performanceMonitor';
import styles from './PerformanceDebugger.module.css';

interface PerformanceDebuggerProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

const PerformanceDebugger: React.FC<PerformanceDebuggerProps> = React.memo(({
  isVisible = false,
  onToggle
}) => {
  const [metrics, setMetrics] = useState(performanceMonitor.getAllMetrics());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Memoized callbacks to prevent unnecessary re-renders
  const handleRefresh = useCallback(() => {
    setMetrics(performanceMonitor.getAllMetrics());
  }, []);

  const handleClear = useCallback(() => {
    performanceMonitor.clearMetrics();
    setMetrics([]);
  }, []);

  const handleLogSummary = useCallback(() => {
    performanceMonitor.logSummary();
  }, []);

  const handleAutoRefreshToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoRefresh(e.target.checked);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getAllMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className={styles.toggleButton}
        title="Show Performance Debugger"
      >
        📊
      </button>
    );
  }

  // Memoize sorted metrics to prevent unnecessary sorting
  const sortedMetrics = useMemo(() => {
    return [...metrics].sort((a, b) => b.averageRenderTime - a.averageRenderTime);
  }, [metrics]);

  return (
    <div className={styles.debugger}>
      <div className={styles.header}>
        <h3>Performance Monitor</h3>
        <div className={styles.controls}>
          <label className={styles.autoRefreshLabel}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={handleAutoRefreshToggle}
            />
            Auto-refresh
          </label>
          <button onClick={handleRefresh} className={styles.button}>
            🔄 Refresh
          </button>
          <button onClick={handleLogSummary} className={styles.button}>
            📝 Log Summary
          </button>
          <button onClick={handleClear} className={styles.button}>
            🗑️ Clear
          </button>
          <button onClick={onToggle} className={styles.closeButton}>
            ✕
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {sortedMetrics.length === 0 ? (
          <p className={styles.noData}>No performance data available</p>
        ) : (
          <div className={styles.metricsTable}>
            <div className={styles.tableHeader}>
              <div>Component</div>
              <div>Avg Time</div>
              <div>Last Render</div>
              <div>Render Count</div>
              <div>Status</div>
            </div>
            {sortedMetrics.map((metric) => {
              const isSlowRender = metric.averageRenderTime > 16;
              const isVerySlowRender = metric.averageRenderTime > 50;
              
              return (
                <MetricRow
                  key={metric.componentName}
                  metric={metric}
                  isSlowRender={isSlowRender}
                  isVerySlowRender={isVerySlowRender}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon}>⚡</span>
          <span>Fast (&lt;16ms)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon}>⚠️</span>
          <span>Slow (16-50ms)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon}>🐌</span>
          <span>Very Slow (&gt;50ms)</span>
        </div>
      </div>
    </div>
  );
});

// Memoized metric row component to prevent unnecessary re-renders
const MetricRow: React.FC<{
  metric: any;
  isSlowRender: boolean;
  isVerySlowRender: boolean;
}> = React.memo(({ metric, isSlowRender, isVerySlowRender }) => (
  <div
    className={`${styles.tableRow} ${
      isVerySlowRender
        ? styles.verySlowRow
        : isSlowRender
        ? styles.slowRow
        : styles.fastRow
    }`}
  >
    <div className={styles.componentName}>
      {metric.componentName}
    </div>
    <div className={styles.avgTime}>
      {metric.averageRenderTime.toFixed(2)}ms
    </div>
    <div className={styles.lastRender}>
      {metric.renderTime.toFixed(2)}ms
    </div>
    <div className={styles.renderCount}>
      {metric.renderCount}
    </div>
    <div className={styles.status}>
      {isVerySlowRender ? '🐌' : isSlowRender ? '⚠️' : '⚡'}
    </div>
  </div>
));

MetricRow.displayName = 'MetricRow';
PerformanceDebugger.displayName = 'PerformanceDebugger';

export default PerformanceDebugger;