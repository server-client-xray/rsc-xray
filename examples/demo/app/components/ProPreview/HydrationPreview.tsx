/**
 * Hydration Timing Preview Component
 *
 * ⚠️ DEMO PREVIEW ONLY - Visual replica of Pro Hydration feature
 *
 * This shows what the Pro Hydration Timing UI looks like with static data.
 * NO Pro hydration capture or timing analysis logic included.
 *
 * Actual Pro version includes:
 * - Real-time hydration timing capture via Performance API
 * - Per-island timing breakdown
 * - Hydration waterfall visualization
 * - Performance budget warnings
 * - Lighthouse correlation
 */

'use client';

import { mockHydration } from './mockData';
import styles from './ProPreview.module.css';

export function HydrationPreview() {
  const { route, islands, totalMs } = mockHydration;
  const maxMs = Math.max(...islands.map((i) => i.hydrationMs));

  return (
    <div className={styles.preview}>
      <div className={styles.disclaimer}>
        ⚠️ Demo Preview - Pro version captures real hydration timings
      </div>

      <div className={styles.header}>
        <h3 className={styles.title}>Hydration Timings</h3>
        <span className={styles.route}>{route}</span>
      </div>

      <div className={styles.hydrationSummary}>
        <div className={styles.totalTime}>
          <span className={styles.totalLabel}>Total Hydration:</span>
          <span className={styles.totalValue}>{totalMs}ms</span>
        </div>
        <div className={styles.islandCount}>
          <span>{islands.length} client islands</span>
        </div>
      </div>

      <div className={styles.hydrationList}>
        {islands.map((island, index) => (
          <div key={`${island.name}-${index}`} className={styles.hydrationItem}>
            <div className={styles.islandInfo}>
              <span className={styles.islandName}>{island.name}</span>
              <span className={styles.islandFile}>{island.file}</span>
            </div>
            <div className={styles.islandMetrics}>
              <div className={styles.metricBar}>
                <div
                  className={styles.metricFill}
                  style={{
                    width: `${(island.hydrationMs / maxMs) * 100}%`,
                  }}
                />
              </div>
              <span className={styles.metricTime}>{island.hydrationMs}ms</span>
              <span className={styles.metricSize}>{formatBytes(island.bytes)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.features}>
        <h4>Pro Features:</h4>
        <ul>
          <li>✨ Real-time Performance API capture</li>
          <li>⏱️ Per-island timing breakdown</li>
          <li>📊 Hydration waterfall visualization</li>
          <li>⚠️ Performance budget warnings</li>
          <li>🎯 Lighthouse correlation</li>
          <li>📈 Historical timing trends</li>
        </ul>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}
