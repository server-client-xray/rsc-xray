'use client';

import type { ReactElement, ReactNode } from 'react';
import styles from './SplitPanel.module.css';

interface SplitPanelConfig {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
}

export function SplitPanel({ leftPanel, rightPanel }: SplitPanelConfig): ReactElement {
  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>{leftPanel}</div>
      <div className={styles.divider} aria-hidden="true" />
      <div className={styles.rightPanel}>{rightPanel}</div>
    </div>
  );
}
