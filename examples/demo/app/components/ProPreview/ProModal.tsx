/**
 * Pro Feature Modal Component
 *
 * Displays visual previews of Pro features with upgrade CTAs.
 * All previews use static mock data - NO Pro business logic included.
 */

'use client';

import type { ReactElement } from 'react';
import { BoundaryTreePreview } from './BoundaryTreePreview';
import { CacheLensPreview } from './CacheLensPreview';
import { FlightTimelinePreview } from './FlightTimelinePreview';
import { HydrationPreview } from './HydrationPreview';
import styles from './ProModal.module.css';

export type ProFeature = 'overlay' | 'cache-lens' | 'flight-timeline' | 'hydration';

interface ProModalConfig {
  feature: ProFeature;
  isOpen: boolean;
  onClose: () => void;
}

const featureTitles: Record<ProFeature, string> = {
  overlay: 'Component Boundary Tree',
  'cache-lens': 'Cache Lens',
  'flight-timeline': 'Flight Timeline',
  hydration: 'Hydration Timings',
};

export function ProModal({ feature, isOpen, onClose }: ProModalConfig): ReactElement | null {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>
              ✨ {featureTitles[feature]}
              <span className={styles.proBadge}>Pro Feature</span>
            </h2>
            <p className={styles.modalSubtitle}>Interactive preview with static demo data</p>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>{renderFeature(feature)}</div>

        <div className={styles.modalFooter}>
          <div className={styles.ctaSection}>
            <h3 className={styles.ctaTitle}>Get full access to all Pro features</h3>
            <div className={styles.ctaButtons}>
              <a href="https://rsc-xray.dev/pricing" className={styles.upgradeButton}>
                Upgrade to Pro →
              </a>
              <a href="https://rsc-xray.dev/docs/pro" className={styles.learnMoreButton}>
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderFeature(feature: ProFeature): ReactElement {
  switch (feature) {
    case 'overlay':
      return <BoundaryTreePreview />;
    case 'cache-lens':
      return <CacheLensPreview />;
    case 'flight-timeline':
      return <FlightTimelinePreview />;
    case 'hydration':
      return <HydrationPreview />;
  }
}
