'use client';

import styles from './Header.module.css';

interface HeaderConfig {
  showUpgradeCTA: boolean;
}

export function Header({ showUpgradeCTA }: HeaderConfig) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
        </svg>
        <h1 className={styles.logoText}>
          RSC X-Ray <span className={styles.logoSubtext}>Interactive Demo</span>
        </h1>
      </div>

      <nav className={styles.nav}>
        <a
          href="https://rsc-xray.dev"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.navLink}
        >
          Docs
        </a>
        <a
          href="https://github.com/rsc-xray/rsc-xray"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.navLink}
        >
          GitHub
        </a>
        {showUpgradeCTA && (
          <a
            href="https://rsc-xray.dev/pro"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.upgradeButton}
          >
            Upgrade to Pro
          </a>
        )}
      </nav>
    </header>
  );
}
