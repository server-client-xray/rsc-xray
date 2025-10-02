/**
 * Cache Lens Preview Component
 *
 * ⚠️ DEMO PREVIEW ONLY - Visual replica of Pro Cache Lens feature
 *
 * This shows what the Pro Cache Lens UI looks like with static data.
 * NO Pro cache detection algorithms or analysis logic included.
 *
 * Actual Pro version includes:
 * - Real-time cache tag extraction from code
 * - revalidateTag/revalidatePath impact simulation
 * - ISR/PPR metadata analysis
 * - Cache policy conflict detection
 * - Interactive tag filtering
 */

'use client';

import { mockCacheLens } from './mockData';
import styles from './ProPreview.module.css';

export function CacheLensPreview() {
  const { tags } = mockCacheLens;

  return (
    <div className={styles.preview}>
      <div className={styles.disclaimer}>
        ⚠️ Demo Preview - Pro version includes live cache analysis
      </div>

      <div className={styles.header}>
        <h3 className={styles.title}>Cache Lens</h3>
        <span className={styles.subtitle}>Cache tag impact analysis</span>
      </div>

      <div className={styles.cacheGrid}>
        {tags.map((tag) => (
          <div key={tag.name} className={styles.cacheTag}>
            <div className={styles.tagHeader}>
              <span className={styles.tagName}>🏷️ {tag.name}</span>
              <span className={styles.tagCount}>{tag.nodeCount} nodes</span>
            </div>
            <div className={styles.tagRoutes}>
              <strong>Affected routes:</strong>
              {tag.routes.map((route) => (
                <span key={route} className={styles.route}>
                  {route}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.simulation}>
        <h4>Revalidation Simulation</h4>
        <p className={styles.simNote}>Click any tag to see which routes would refresh (Pro only)</p>
      </div>

      <div className={styles.features}>
        <h4>Pro Features:</h4>
        <ul>
          <li>✨ Automatic cache tag extraction</li>
          <li>🔄 revalidateTag impact simulation</li>
          <li>📍 revalidatePath visualization</li>
          <li>⚙️ ISR/PPR metadata analysis</li>
          <li>⚠️ Cache policy conflict warnings</li>
          <li>🔍 Interactive tag filtering & search</li>
        </ul>
      </div>
    </div>
  );
}
