/**
 * Flight Timeline Preview Component
 *
 * ⚠️ DEMO PREVIEW ONLY - Visual replica of Pro Flight Timeline feature
 *
 * This shows what the Pro Flight Timeline looks like with static data.
 * NO Pro Flight chunk parsing or timeline analysis logic included.
 *
 * Actual Pro version includes:
 * - Real-time Flight chunk capture during SSR
 * - Streaming timeline visualization
 * - Chunk size and timing analysis
 * - Waterfall detection
 * - Performance optimization suggestions
 */

'use client';

import type { ReactElement } from 'react';
import { mockFlightTimeline } from './mockData';
import styles from './ProPreview.module.css';

export function FlightTimelinePreview(): ReactElement {
  const { route, chunks } = mockFlightTimeline;
  const maxTime = Math.max(...chunks.map((c) => c.timestamp));

  return (
    <div className={styles.preview}>
      <div className={styles.disclaimer}>
        ⚠️ Demo Preview - Pro version captures real Flight chunks
      </div>

      <div className={styles.header}>
        <h3 className={styles.title}>Flight Timeline</h3>
        <span className={styles.route}>{route}</span>
      </div>

      <div className={styles.timeline}>
        {chunks.map((chunk) => (
          <div key={chunk.index} className={styles.timelineItem}>
            <div className={styles.chunkLabel}>
              <span className={styles.chunkIndex}>Chunk {chunk.index}</span>
              {chunk.label && <span className={styles.chunkName}>{chunk.label}</span>}
            </div>
            <div className={styles.chunkBar}>
              <div
                className={styles.chunkProgress}
                style={{
                  width: `${(chunk.timestamp / maxTime) * 100}%`,
                }}
              />
              <span className={styles.chunkTime}>{chunk.timestamp}ms</span>
            </div>
            <span className={styles.chunkSize}>{formatBytes(chunk.size)}</span>
          </div>
        ))}
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total Chunks:</span>
          <span className={styles.statValue}>{chunks.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>First Chunk:</span>
          <span className={styles.statValue}>{chunks[0]?.timestamp}ms</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Last Chunk:</span>
          <span className={styles.statValue}>{chunks[chunks.length - 1]?.timestamp}ms</span>
        </div>
      </div>

      <div className={styles.features}>
        <h4>Pro Features:</h4>
        <ul>
          <li>✨ Real-time Flight chunk capture</li>
          <li>📊 Streaming performance visualization</li>
          <li>🌊 Waterfall detection & warnings</li>
          <li>⚡ Chunk size & timing analysis</li>
          <li>💡 Optimization suggestions</li>
          <li>📈 Historical timeline comparison</li>
        </ul>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}
