'use client';

import type { ReactElement } from 'react';
import styles from './StatusBar.module.css';

interface StatusBarConfig {
  status: 'idle' | 'analyzing' | 'error';
  diagnosticsCount: number;
  duration?: number;
}

export function StatusBar({ status, diagnosticsCount, duration }: StatusBarConfig): ReactElement {
  const statusText = {
    idle: 'Ready',
    analyzing: 'Analyzing...',
    error: 'Analysis Error',
  };

  const statusIcon = {
    idle: '✓',
    analyzing: '⏳',
    error: '✗',
  };

  return (
    <footer className={styles.statusBar} data-testid="status-bar">
      <div className={styles.statusLeft}>
        <span className={`${styles.statusIndicator} ${styles[status]}`}>
          {statusIcon[status]} {statusText[status]}
        </span>
        {duration !== undefined && <span className={styles.duration}>{duration}ms</span>}
      </div>

      <div className={styles.statusRight}>
        <span className={styles.diagnostics}>
          {diagnosticsCount === 0 ? (
            <span className={styles.noDiagnostics}>No issues</span>
          ) : (
            <>
              <span className={styles.diagnosticsCount}>{diagnosticsCount}</span>
              {diagnosticsCount === 1 ? ' issue' : ' issues'}
            </>
          )}
        </span>
      </div>
    </footer>
  );
}
